import { FormEvent, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Activity,
  Apple,
  ArrowRight,
  Award,
  BarChart3,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock,
  Droplet,
  Dumbbell,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  Plus,
  Salad,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types';
import { ScreenshotMealPage, ScreenshotWorkoutPage } from '@/components/ReferenceStylePages';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Workout = Database['public']['Tables']['workout_logs']['Row'];
type Meal = Database['public']['Tables']['meal_logs']['Row'];
type WaterLog = Database['public']['Tables']['water_logs']['Row'];
type Page = 'dashboard' | 'tasks' | 'workouts' | 'meals' | 'streaks';

type ProfileForm = {
  name: string;
  age: string;
  height: string;
  weight: string;
  activity_level: string;
  workout_activity: string;
  workout_experience: string;
  diet: string;
};

type Exercise = { name: string; category: string; weighted: boolean };
type Food = { name: string; category: string; cuisine: string; calories: number; protein: number; carbs: number; fat: number };

const workoutLibrary: Exercise[] = [
  // ===== WEIGHTED (100+) =====
  // Chest
  { name: 'Barbell Bench Press', category: 'Chest', weighted: true },
  { name: 'Dumbbell Bench Press', category: 'Chest', weighted: true },
  { name: 'Incline Barbell Press', category: 'Chest', weighted: true },
  { name: 'Incline Dumbbell Press', category: 'Chest', weighted: true },
  { name: 'Decline Barbell Press', category: 'Chest', weighted: true },
  { name: 'Decline Dumbbell Press', category: 'Chest', weighted: true },
  { name: 'Cable Chest Fly', category: 'Chest', weighted: true },
  { name: 'Cable Crossover', category: 'Chest', weighted: true },
  { name: 'Pec Deck Machine', category: 'Chest', weighted: true },
  { name: 'Dumbbell Pullover', category: 'Chest', weighted: true },
  { name: 'Machine Chest Press', category: 'Chest', weighted: true },
  { name: 'Smith Machine Bench Press', category: 'Chest', weighted: true },
  // Back
  { name: 'Barbell Row', category: 'Back', weighted: true },
  { name: 'Dumbbell Row', category: 'Back', weighted: true },
  { name: 'Lat Pulldown', category: 'Back', weighted: true },
  { name: 'Cable Row', category: 'Back', weighted: true },
  { name: 'T-Bar Row', category: 'Back', weighted: true },
  { name: 'Seated Cable Row', category: 'Back', weighted: true },
  { name: 'Face Pull', category: 'Back', weighted: true },
  { name: 'Straight Arm Pulldown', category: 'Back', weighted: true },
  { name: 'Meadows Row', category: 'Back', weighted: true },
  { name: 'Rack Pull', category: 'Back', weighted: true },
  { name: 'Pendlay Row', category: 'Back', weighted: true },
  { name: 'Machine Row', category: 'Back', weighted: true },
  // Shoulders
  { name: 'Barbell Overhead Press', category: 'Shoulders', weighted: true },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders', weighted: true },
  { name: 'Arnold Press', category: 'Shoulders', weighted: true },
  { name: 'Dumbbell Lateral Raise', category: 'Shoulders', weighted: true },
  { name: 'Cable Lateral Raise', category: 'Shoulders', weighted: true },
  { name: 'Barbell Front Raise', category: 'Shoulders', weighted: true },
  { name: 'Dumbbell Front Raise', category: 'Shoulders', weighted: true },
  { name: 'Cable Front Raise', category: 'Shoulders', weighted: true },
  { name: 'Reverse Pec Deck', category: 'Shoulders', weighted: true },
  { name: 'Cable Face Pull', category: 'Shoulders', weighted: true },
  { name: 'Smith Machine Shoulder Press', category: 'Shoulders', weighted: true },
  { name: 'Machine Shoulder Press', category: 'Shoulders', weighted: true },
  // Arms — Biceps
  { name: 'Barbell Bicep Curl', category: 'Biceps', weighted: true },
  { name: 'Dumbbell Bicep Curl', category: 'Biceps', weighted: true },
  { name: 'Hammer Curl', category: 'Biceps', weighted: true },
  { name: 'Preacher Curl', category: 'Biceps', weighted: true },
  { name: 'Cable Curl', category: 'Biceps', weighted: true },
  { name: 'Concentration Curl', category: 'Biceps', weighted: true },
  { name: 'Incline Dumbbell Curl', category: 'Biceps', weighted: true },
  { name: 'Spider Curl', category: 'Biceps', weighted: true },
  { name: 'Zottman Curl', category: 'Biceps', weighted: true },
  { name: 'EZ Bar Curl', category: 'Biceps', weighted: true },
  // Arms — Triceps
  { name: 'Skull Crusher', category: 'Triceps', weighted: true },
  { name: 'Tricep Pushdown', category: 'Triceps', weighted: true },
  { name: 'Overhead Tricep Extension', category: 'Triceps', weighted: true },
  { name: 'Rope Tricep Pushdown', category: 'Triceps', weighted: true },
  { name: 'Dumbbell Tricep Kickback', category: 'Triceps', weighted: true },
  { name: 'Close Grip Bench Press', category: 'Triceps', weighted: true },
  { name: 'Cable Overhead Extension', category: 'Triceps', weighted: true },
  { name: 'Reverse Grip Pushdown', category: 'Triceps', weighted: true },
  { name: 'JM Press', category: 'Triceps', weighted: true },
  // Legs
  { name: 'Barbell Squat', category: 'Legs', weighted: true },
  { name: 'Front Squat', category: 'Legs', weighted: true },
  { name: 'Goblet Squat', category: 'Legs', weighted: true },
  { name: 'Leg Press', category: 'Legs', weighted: true },
  { name: 'Hack Squat', category: 'Legs', weighted: true },
  { name: 'Bulgarian Split Squat', category: 'Legs', weighted: true },
  { name: 'Walking Lunge (Weighted)', category: 'Legs', weighted: true },
  { name: 'Romanian Deadlift', category: 'Legs', weighted: true },
  { name: 'Stiff Leg Deadlift', category: 'Legs', weighted: true },
  { name: 'Leg Curl', category: 'Legs', weighted: true },
  { name: 'Seated Leg Curl', category: 'Legs', weighted: true },
  { name: 'Leg Extension', category: 'Legs', weighted: true },
  { name: 'Calf Raise (Weighted)', category: 'Legs', weighted: true },
  { name: 'Seated Calf Raise', category: 'Legs', weighted: true },
  { name: 'Smith Machine Squat', category: 'Legs', weighted: true },
  // Glutes
  { name: 'Barbell Hip Thrust', category: 'Glutes', weighted: true },
  { name: 'Cable Glute Kickback', category: 'Glutes', weighted: true },
  { name: 'Weighted Step Up', category: 'Glutes', weighted: true },
  { name: 'Cable Pull Through', category: 'Glutes', weighted: true },
  { name: 'Sumo Deadlift', category: 'Glutes', weighted: true },
  // Core (weighted)
  { name: 'Weighted Crunch', category: 'Core', weighted: true },
  { name: 'Cable Crunch', category: 'Core', weighted: true },
  { name: 'Weighted Russian Twist', category: 'Core', weighted: true },
  { name: 'Cable Wood Chop', category: 'Core', weighted: true },
  { name: 'Weighted Hanging Leg Raise', category: 'Core', weighted: true },
  // Full body / Olympic
  { name: 'Barbell Deadlift', category: 'Full Body', weighted: true },
  { name: 'Sumo Deadlift (Full Body)', category: 'Full Body', weighted: true },
  { name: 'Trap Bar Deadlift', category: 'Full Body', weighted: true },
  { name: 'Power Clean', category: 'Full Body', weighted: true },
  { name: 'Hang Clean', category: 'Full Body', weighted: true },
  { name: 'Snatch', category: 'Full Body', weighted: true },
  { name: 'Clean and Press', category: 'Full Body', weighted: true },
  { name: 'Kettlebell Swing', category: 'Full Body', weighted: true },
  { name: 'Kettlebell Snatch', category: 'Full Body', weighted: true },
  { name: 'Kettlebell Clean', category: 'Full Body', weighted: true },
  { name: 'Farmer Walk (Weighted)', category: 'Full Body', weighted: true },
  { name: 'Kettlebell Goblet Squat', category: 'Full Body', weighted: true },
  { name: 'Dumbbell Thruster', category: 'Full Body', weighted: true },
  { name: 'Barbell Thruster', category: 'Full Body', weighted: true },
  { name: 'Wall Ball Throw', category: 'Full Body', weighted: true },
  { name: 'Landmine Squat', category: 'Legs', weighted: true },
  { name: 'Deficit Reverse Lunge', category: 'Legs', weighted: true },
  { name: 'Cable Leg Abduction', category: 'Glutes', weighted: true },
  { name: 'Chest Supported T-Bar Row', category: 'Back', weighted: true },
  { name: 'Single Arm Dumbbell Press', category: 'Chest', weighted: true },
  { name: 'Cable Y Raise', category: 'Shoulders', weighted: true },
  { name: 'Incline Cable Curl', category: 'Biceps', weighted: true },
  { name: 'Dumbbell Tate Press', category: 'Triceps', weighted: true },
  { name: 'Kettlebell Windmill', category: 'Core', weighted: true },
  { name: 'Sled Push', category: 'Full Body', weighted: true },

  // ===== NON-WEIGHTED (100+) =====
  // Push-ups
  { name: 'Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Wide Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Diamond Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Decline Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Incline Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Pike Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Archer Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Clap Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Spider Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'One Arm Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Hindu Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Planche Push Ups', category: 'Bodyweight', weighted: false },
  // Pull-ups
  { name: 'Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Chin Ups', category: 'Bodyweight', weighted: false },
  { name: 'Wide Grip Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Commando Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Archer Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Typewriter Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Muscle Ups', category: 'Bodyweight', weighted: false },
  { name: 'Negative Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Australian Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Kipping Pull Ups', category: 'Bodyweight', weighted: false },
  // Squats & Legs
  { name: 'Bodyweight Squat', category: 'Bodyweight', weighted: false },
  { name: 'Jump Squats', category: 'Bodyweight', weighted: false },
  { name: 'Pistol Squats', category: 'Bodyweight', weighted: false },
  { name: 'Cossack Squats', category: 'Bodyweight', weighted: false },
  { name: 'Split Squats', category: 'Bodyweight', weighted: false },
  { name: 'Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Reverse Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Walking Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Jumping Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Curtsy Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Side Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Sissy Squats', category: 'Bodyweight', weighted: false },
  { name: 'Shrimp Squats', category: 'Bodyweight', weighted: false },
  // Glutes (bodyweight)
  { name: 'Glute Bridge', category: 'Bodyweight', weighted: false },
  { name: 'Single Leg Glute Bridge', category: 'Bodyweight', weighted: false },
  { name: 'Bulgarian Split Squat (BW)', category: 'Bodyweight', weighted: false },
  { name: 'Step Ups', category: 'Bodyweight', weighted: false },
  { name: 'Calf Raises (BW)', category: 'Bodyweight', weighted: false },
  { name: 'Single Leg Calf Raises', category: 'Bodyweight', weighted: false },
  // Core
  { name: 'Plank', category: 'Core', weighted: false },
  { name: 'Side Plank', category: 'Core', weighted: false },
  { name: 'Plank to Push Up', category: 'Core', weighted: false },
  { name: 'Plank Jacks', category: 'Core', weighted: false },
  { name: 'Hollow Hold', category: 'Core', weighted: false },
  { name: 'Hollow Body Rock', category: 'Core', weighted: false },
  { name: 'Sit Ups', category: 'Core', weighted: false },
  { name: 'Crunches', category: 'Core', weighted: false },
  { name: 'Reverse Crunches', category: 'Core', weighted: false },
  { name: 'Bicycle Crunches', category: 'Core', weighted: false },
  { name: 'Russian Twists', category: 'Core', weighted: false },
  { name: 'Leg Raises', category: 'Core', weighted: false },
  { name: 'Hanging Leg Raises', category: 'Core', weighted: false },
  { name: 'Flutter Kicks', category: 'Core', weighted: false },
  { name: 'Scissor Kicks', category: 'Core', weighted: false },
  { name: 'V-Ups', category: 'Core', weighted: false },
  { name: 'Toe Touches', category: 'Core', weighted: false },
  { name: 'Mountain Climbers', category: 'Core', weighted: false },
  { name: 'Dead Bug', category: 'Core', weighted: false },
  { name: 'Bird Dog', category: 'Core', weighted: false },
  { name: 'L-Sit', category: 'Core', weighted: false },
  { name: 'Superman Hold', category: 'Core', weighted: false },
  // Cardio
  { name: 'Burpees', category: 'Cardio', weighted: false },
  { name: 'Half Burpees', category: 'Cardio', weighted: false },
  { name: 'Tuck Jumps', category: 'Cardio', weighted: false },
  { name: 'Squat Jumps', category: 'Cardio', weighted: false },
  { name: 'Box Jumps', category: 'Cardio', weighted: false },
  { name: 'Long Jumps', category: 'Cardio', weighted: false },
  { name: 'Jumping Jacks', category: 'Cardio', weighted: false },
  { name: 'Cross Jacks', category: 'Cardio', weighted: false },
  { name: 'Seal Jacks', category: 'Cardio', weighted: false },
  { name: 'High Knees', category: 'Cardio', weighted: false },
  { name: 'Butt Kicks', category: 'Cardio', weighted: false },
  { name: 'Jump Rope', category: 'Cardio', weighted: false },
  { name: 'Sprinting in Place', category: 'Cardio', weighted: false },
  { name: 'Shuttle Runs', category: 'Cardio', weighted: false },
  { name: 'Suicides', category: 'Cardio', weighted: false },
  { name: 'Squat Thrusts', category: 'Cardio', weighted: false },
  { name: 'Bear Crawl', category: 'Cardio', weighted: false },
  { name: 'Crab Walk', category: 'Cardio', weighted: false },
  // Mobility / Stretch
  { name: 'Wall Sit', category: 'Mobility', weighted: false },
  { name: 'Cobra Stretch', category: 'Mobility', weighted: false },
  { name: 'Downward Dog', category: 'Mobility', weighted: false },
  { name: 'Cat Cow Stretch', category: 'Mobility', weighted: false },
  { name: 'Pigeon Pose', category: 'Mobility', weighted: false },
  { name: 'Child Pose', category: 'Mobility', weighted: false },
  { name: 'Hip Flexor Stretch', category: 'Mobility', weighted: false },
  { name: 'Hamstring Stretch', category: 'Mobility', weighted: false },
  { name: 'Quad Stretch', category: 'Mobility', weighted: false },
  { name: 'Shoulder Dislocates', category: 'Mobility', weighted: false },
  { name: 'World Greatest Stretch', category: 'Mobility', weighted: false },
  { name: 'Inchworms', category: 'Mobility', weighted: false },
  { name: 'Bear Plank Shoulder Taps', category: 'Core', weighted: false },
  { name: 'Cross Body Mountain Climbers', category: 'Core', weighted: false },
  { name: 'Hollow Body Flutter', category: 'Core', weighted: false },
  { name: 'Skater Hops', category: 'Cardio', weighted: false },
  { name: 'Lateral Bounds', category: 'Cardio', weighted: false },
  { name: 'Fast Feet Shuffle', category: 'Cardio', weighted: false },
  { name: 'Broad Jump', category: 'Cardio', weighted: false },
  { name: 'Bear Crawl Reach', category: 'Bodyweight', weighted: false },
  { name: 'Crab Toe Touch', category: 'Bodyweight', weighted: false },
  { name: '90/90 Hip Switch', category: 'Mobility', weighted: false },
  { name: 'Thoracic Rotation', category: 'Mobility', weighted: false },
];

const foodLibrary: Food[] = [
  // Breakfast — Indian
  { name: 'Poha', category: 'Breakfast', cuisine: 'Indian', calories: 130, protein: 2.5, carbs: 27, fat: 1.5 },
  { name: 'Aloo Paratha', category: 'Breakfast', cuisine: 'Indian', calories: 294, protein: 6, carbs: 40, fat: 10 },
  { name: 'Masala Omelette', category: 'Breakfast', cuisine: 'Indian', calories: 154, protein: 11, carbs: 1, fat: 12 },
  { name: 'Paneer Bhurji', category: 'Breakfast', cuisine: 'Indian', calories: 200, protein: 12, carbs: 5, fat: 14 },
  { name: 'Khakra', category: 'Breakfast', cuisine: 'Indian', calories: 312, protein: 9, carbs: 56, fat: 4 },
  // Breakfast — South Indian
  { name: 'Idli', category: 'Breakfast', cuisine: 'South Indian', calories: 58, protein: 2, carbs: 12, fat: 0.4 },
  { name: 'Dosa', category: 'Breakfast', cuisine: 'South Indian', calories: 168, protein: 4, carbs: 29, fat: 3.7 },
  { name: 'Upma', category: 'Breakfast', cuisine: 'South Indian', calories: 150, protein: 3, carbs: 28, fat: 3 },
  { name: 'Pongal', category: 'Breakfast', cuisine: 'South Indian', calories: 120, protein: 3, carbs: 22, fat: 2 },
  { name: 'Appam', category: 'Breakfast', cuisine: 'South Indian', calories: 110, protein: 2, carbs: 23, fat: 0.5 },
  { name: 'Puttu', category: 'Breakfast', cuisine: 'South Indian', calories: 156, protein: 3, carbs: 30, fat: 2 },
  { name: 'Rava Upma', category: 'Breakfast', cuisine: 'South Indian', calories: 150, protein: 3, carbs: 28, fat: 3 },
  // Breakfast — Multi-cuisine
  { name: 'Oatmeal', category: 'Breakfast', cuisine: 'Multi-cuisine', calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
  { name: 'Greek Yogurt', category: 'Breakfast', cuisine: 'Multi-cuisine', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: 'Scrambled Eggs', category: 'Breakfast', cuisine: 'Multi-cuisine', calories: 148, protein: 13, carbs: 2, fat: 10 },
  { name: 'Avocado Toast', category: 'Breakfast', cuisine: 'Multi-cuisine', calories: 195, protein: 6, carbs: 24, fat: 8 },
  // Lunch — Indian
  { name: 'Rajma Chawal', category: 'Lunch', cuisine: 'Indian', calories: 180, protein: 7, carbs: 30, fat: 3 },
  { name: 'Dal Tadka', category: 'Lunch', cuisine: 'Indian', calories: 150, protein: 9, carbs: 17, fat: 4 },
  { name: 'Chole', category: 'Lunch', cuisine: 'Indian', calories: 164, protein: 9, carbs: 27, fat: 3 },
  { name: 'Aloo Gobi', category: 'Lunch', cuisine: 'Indian', calories: 130, protein: 3, carbs: 15, fat: 6 },
  { name: 'Palak Paneer', category: 'Lunch', cuisine: 'Indian', calories: 189, protein: 11, carbs: 6, fat: 13 },
  { name: 'Biryani', category: 'Lunch', cuisine: 'Indian', calories: 201, protein: 6, carbs: 27, fat: 7 },
  { name: 'Roti with Dal', category: 'Lunch', cuisine: 'Indian', calories: 180, protein: 6, carbs: 33, fat: 3 },
  { name: 'Veg Pulao', category: 'Lunch', cuisine: 'Indian', calories: 145, protein: 3, carbs: 28, fat: 2.5 },
  // Lunch — South Indian
  { name: 'Sambar Rice', category: 'Lunch', cuisine: 'South Indian', calories: 120, protein: 4, carbs: 22, fat: 2 },
  { name: 'Curd Rice', category: 'Lunch', cuisine: 'South Indian', calories: 98, protein: 3, carbs: 18, fat: 1.5 },
  { name: 'Lemon Rice', category: 'Lunch', cuisine: 'South Indian', calories: 136, protein: 3, carbs: 25, fat: 3 },
  { name: 'Tamarind Rice', category: 'Lunch', cuisine: 'South Indian', calories: 130, protein: 3, carbs: 24, fat: 2.5 },
  { name: 'Rasam Rice', category: 'Lunch', cuisine: 'South Indian', calories: 80, protein: 2, carbs: 16, fat: 1 },
  // Lunch — Multi-cuisine
  { name: 'Grilled Chicken', category: 'Lunch', cuisine: 'Multi-cuisine', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Brown Rice', category: 'Lunch', cuisine: 'Multi-cuisine', calories: 123, protein: 2.7, carbs: 25.6, fat: 1 },
  { name: 'Quinoa Bowl', category: 'Lunch', cuisine: 'Multi-cuisine', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'Chicken Salad', category: 'Lunch', cuisine: 'Multi-cuisine', calories: 140, protein: 20, carbs: 5, fat: 4 },
  // Dinner — Indian
  { name: 'Paneer Tikka', category: 'Dinner', cuisine: 'Indian', calories: 260, protein: 18, carbs: 5, fat: 18 },
  { name: 'Chicken Tikka', category: 'Dinner', cuisine: 'Indian', calories: 165, protein: 25, carbs: 2, fat: 5 },
  { name: 'Khichdi', category: 'Dinner', cuisine: 'Indian', calories: 120, protein: 4, carbs: 22, fat: 2 },
  { name: 'Stuffed Capsicum', category: 'Dinner', cuisine: 'Indian', calories: 80, protein: 2, carbs: 10, fat: 3 },
  { name: 'Baingan Bharta', category: 'Dinner', cuisine: 'Indian', calories: 100, protein: 2, carbs: 12, fat: 5 },
  { name: 'Roti', category: 'Dinner', cuisine: 'Indian', calories: 120, protein: 3, carbs: 18, fat: 2 },
  // Dinner — South Indian
  { name: 'Dosa with Sambar', category: 'Dinner', cuisine: 'South Indian', calories: 150, protein: 5, carbs: 25, fat: 3 },
  { name: 'Uttapam', category: 'Dinner', cuisine: 'South Indian', calories: 170, protein: 5, carbs: 28, fat: 4 },
  { name: 'Fish Curry', category: 'Dinner', cuisine: 'South Indian', calories: 130, protein: 15, carbs: 4, fat: 6 },
  { name: 'Rasam with Rice', category: 'Dinner', cuisine: 'South Indian', calories: 85, protein: 2, carbs: 17, fat: 1 },
  // Dinner — Multi-cuisine
  { name: 'Salmon', category: 'Dinner', cuisine: 'Multi-cuisine', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Mixed Greens', category: 'Dinner', cuisine: 'Multi-cuisine', calories: 20, protein: 1.5, carbs: 3, fat: 0.2 },
  { name: 'Grilled Fish', category: 'Dinner', cuisine: 'Multi-cuisine', calories: 120, protein: 22, carbs: 0, fat: 3 },
  { name: 'Stir Fry Vegetables', category: 'Dinner', cuisine: 'Multi-cuisine', calories: 80, protein: 3, carbs: 10, fat: 3 },
  // Snacks — Indian
  { name: 'Dhokla', category: 'Snacks', cuisine: 'Indian', calories: 160, protein: 9, carbs: 22, fat: 5 },
  { name: 'Khandvi', category: 'Snacks', cuisine: 'Indian', calories: 170, protein: 7, carbs: 18, fat: 8 },
  { name: 'Pakora', category: 'Snacks', cuisine: 'Indian', calories: 280, protein: 6, carbs: 30, fat: 15 },
  { name: 'Sprouts Salad', category: 'Snacks', cuisine: 'Indian', calories: 120, protein: 7, carbs: 15, fat: 3 },
  { name: 'Masala Peanuts', category: 'Snacks', cuisine: 'Indian', calories: 320, protein: 13, carbs: 16, fat: 25 },
  // Snacks — South Indian
  { name: 'Murukku', category: 'Snacks', cuisine: 'South Indian', calories: 350, protein: 7, carbs: 50, fat: 14 },
  { name: 'Sundal', category: 'Snacks', cuisine: 'South Indian', calories: 150, protein: 6, carbs: 22, fat: 3 },
  { name: 'Bajji', category: 'Snacks', cuisine: 'South Indian', calories: 250, protein: 4, carbs: 35, fat: 10 },
  { name: 'Vada', category: 'Snacks', cuisine: 'South Indian', calories: 236, protein: 9, carbs: 24, fat: 14 },
  { name: 'Mixture', category: 'Snacks', cuisine: 'South Indian', calories: 400, protein: 8, carbs: 48, fat: 20 },
  // Snacks — Multi-cuisine
  { name: 'Banana', category: 'Snacks', cuisine: 'Multi-cuisine', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Apple', category: 'Snacks', cuisine: 'Multi-cuisine', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: 'Almonds', category: 'Snacks', cuisine: 'Multi-cuisine', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'Trail Mix', category: 'Snacks', cuisine: 'Multi-cuisine', calories: 462, protein: 15, carbs: 28, fat: 32 },
  { name: 'Protein Bar', category: 'Snacks', cuisine: 'Multi-cuisine', calories: 200, protein: 20, carbs: 18, fat: 6 },
];

const emptyProfile: ProfileForm = { name: '', age: '', height: '', weight: '', activity_level: 'moderate', workout_activity: '', workout_experience: 'beginner', diet: '' };

const taskCategories = [
  { id: 'fitness', label: 'Fitness', color: '#28b8f3' },
  { id: 'nutrition', label: 'Nutrition', color: '#7de2cb' },
  { id: 'wellness', label: 'Wellness', color: '#f0b35c' },
  { id: 'personal', label: 'Personal', color: '#c89bf5' },
];

const taskPriorities = [
  { id: 'low', label: 'Low', color: '#5b8a6e' },
  { id: 'medium', label: 'Medium', color: '#d4a544' },
  { id: 'high', label: 'High', color: '#d4654a' },
];

function estimateWorkoutCalories(workout: Workout, profile: Profile | null) {
  const weight = Number(profile?.weight) || 70;
  const minutes = Number(workout.duration) || (Number(workout.sets) * 4 + Number(workout.reps) * 0.15);
  const intensity = workout.weighted ? 6 : 5;
  return Math.round((intensity * 3.5 * weight / 200) * minutes);
}

function calculateMealTotals(meals: Meal[]) {
  return meals.reduce((total, meal) => ({
    calories: total.calories + Number(meal.calories),
    protein: total.protein + Number(meal.protein),
    carbs: total.carbs + Number(meal.carbs),
    fat: total.fat + Number(meal.fat),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function calculateCalorieTarget(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const height = Number(profile.height) || 170;
  const age = Number(profile.age) || 30;
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activityMultiplier = profile.activity_level === 'high' ? 1.75 : profile.activity_level === 'moderate' ? 1.55 : 1.2;
  return Math.round(bmr * activityMultiplier);
}

function calculateWaterGoal(profile: Profile): number {
  const weight = Number(profile.weight) || 70;
  const baseMl = weight * 35;
  const extra = profile.activity_level === 'high' ? 500 : profile.activity_level === 'moderate' ? 250 : 0;
  return Math.round((baseMl + extra) / 100) * 100;
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><img src="/ChatGPT_Image_Sep_23,_2026,_07_54_43_PM.png" alt="Loop Fit logo" /><span>LOOP <b>FIT</b></span></div>;
}

function Splash() {
  return <main className="splash"><div className="splash-mark"><img src="/ChatGPT_Image_Sep_23,_2026,_07_54_43_PM.png" alt="Loop Fit" /><p>Small steps. Stronger you.</p></div></main>;
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    setBusy(false);
  }

  return <main className="auth-shell"><div className="auth-panel"><Logo /><div className="eyebrow">PERSONAL FITNESS SYSTEM</div><h1>{mode === 'login' ? 'Welcome back.' : 'Start your loop.'}</h1><p className="muted">{mode === 'login' ? 'Your next stronger day starts here.' : 'Create your own private fitness space.'}</p><form onSubmit={submit} className="auth-form"><label>Email ID<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></label>{error && <div className="error-box">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}<ArrowRight size={17} /></button></form><button className="text-button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create Account / Sign Up' : 'Already have an account? Login'}</button></div><div className="auth-aside"><div className="ring-art"><div className="ring-art-inner"><Flame size={28} /><strong>01</strong><span>SMALL STEPS</span></div></div><p>Track the details.<br /><b>Feel the difference.</b></p></div></main>;
}

function ProfileSetup({ userId, onDone }: { userId: string; onDone: (profile: Profile) => void }) {
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  function update(key: keyof ProfileForm, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); const { data, error: saveError } = await supabase.from('profiles').upsert({ id: userId, ...form, age: Number(form.age), height: Number(form.height), weight: Number(form.weight) }).select().maybeSingle(); if (saveError || !data) setError(saveError?.message || 'Could not save your profile.'); else onDone(data); setBusy(false); }
  return <main className="setup-shell"><div className="setup-card"><Logo compact /><div className="eyebrow">FIRST LOOP</div><h1>Make it yours.</h1><p className="muted">A few details help us make your estimates more personal.</p><form className="setup-form" onSubmit={submit}><div className="form-grid"><label>Name<input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Your name" /></label><label>Age<input required type="number" min="13" max="100" value={form.age} onChange={(event) => update('age', event.target.value)} placeholder="24" /></label><label>Height (cm)<input required type="number" min="80" value={form.height} onChange={(event) => update('height', event.target.value)} placeholder="175" /></label><label>Weight (kg)<input required type="number" min="25" value={form.weight} onChange={(event) => update('weight', event.target.value)} placeholder="70" /></label><label>Activity level<select value={form.activity_level} onChange={(event) => update('activity_level', event.target.value)}><option value="light">Light</option><option value="moderate">Moderate</option><option value="high">High</option></select></label><label>Workout experience<select value={form.workout_experience} onChange={(event) => update('workout_experience', event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div><label>Workout activity information<textarea value={form.workout_activity} onChange={(event) => update('workout_activity', event.target.value)} placeholder="Tell us what your week usually looks like" /></label><label>Food / diet information<textarea value={form.diet} onChange={(event) => update('diet', event.target.value)} placeholder="Preferences, allergies, or goals" /></label>{error && <div className="error-box">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'Saving...' : 'Enter Loop Fit'}<ArrowRight size={17} /></button></form></div></main>;
}

function Ring({ value, label, accent = '#28b8f3' }: { value: number; label: string; accent?: string }) { const safeValue = Math.min(100, Math.max(0, value)); return <div className="ring" style={{ '--progress': `${safeValue * 3.6}deg`, '--ring-color': accent } as React.CSSProperties}><div className="ring-center"><strong>{Math.round(safeValue)}<small>%</small></strong><span>{label}</span></div></div>; }

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }

function Dashboard({ profile, tasks, workouts, meals, waterLogs, go, onAddWater, onRemoveWater }: { profile: Profile; tasks: Task[]; workouts: Workout[]; meals: Meal[]; waterLogs: WaterLog[]; go: (page: Page) => void; onAddWater: (ml: number) => void; onRemoveWater: (id: string) => void }) {
  const totals = calculateMealTotals(meals); const completedTasks = tasks.filter((task) => task.completed).length; const workoutCalories = workouts.reduce((sum, workout) => sum + estimateWorkoutCalories(workout, profile), 0); const workoutProgress = workouts.length ? workouts.filter((workout) => workout.completed).length / workouts.length * 100 : 0; const taskProgress = tasks.length ? completedTasks / tasks.length * 100 : 0;
  const calorieTarget = calculateCalorieTarget(profile);
  const caloriesRemaining = calorieTarget - Math.round(totals.calories) + workoutCalories;
  const calorieProgress = calorieTarget > 0 ? Math.min(100, (totals.calories / calorieTarget) * 100) : 0;
  const waterGoal = calculateWaterGoal(profile);
  const waterConsumed = waterLogs.filter((w) => isToday(w.created_at)).reduce((sum, w) => sum + Number(w.amount_ml), 0);
  const waterRemaining = Math.max(0, waterGoal - waterConsumed);
  const waterProgress = waterGoal > 0 ? Math.min(100, (waterConsumed / waterGoal) * 100) : 0;
  const macroGrams = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
  const proteinPct = macroGrams > 0 ? (totals.protein * 4 / macroGrams) * 100 : 0;
  const carbsPct = macroGrams > 0 ? (totals.carbs * 4 / macroGrams) * 100 : 0;
  const fatPct = macroGrams > 0 ? (totals.fat * 9 / macroGrams) * 100 : 0;
  const donutGradient = macroGrams > 0
    ? `conic-gradient(from -90deg, #28b8f3 0 ${proteinPct}%, #7de2cb ${proteinPct}% ${proteinPct + carbsPct}%, #f0b35c ${proteinPct + carbsPct}% ${proteinPct + carbsPct + fatPct}%, #1a2f3a ${proteinPct + carbsPct + fatPct}% 100%)`
    : 'conic-gradient(from -90deg, #1a2f3a 0 100%)';
  const todayWaterLogs = waterLogs.filter((w) => isToday(w.created_at));
  return <div className="page-content"><div className="page-heading"><div><div className="eyebrow">TODAY</div><h1>Good to see you, {profile.name.split(' ')[0] || 'there'}.</h1><p className="muted">Keep your rhythm. Every session counts.</p></div><button className="outline-button" onClick={() => go('workouts')}><Plus size={16} /> Log activity</button></div><div className="stats-grid"><StatCard icon={<Flame size={18} />} label="Food intake" value={`${Math.round(totals.calories)} kcal`} detail={`of ${calorieTarget} kcal target`} /><StatCard icon={<Dumbbell size={18} />} label="Workout burn" value={`${workoutCalories} kcal`} detail="Estimated calories" /><StatCard icon={<Target size={18} />} label="Remaining" value={`${caloriesRemaining} kcal`} detail="Calories left today" /><StatCard icon={<Droplet size={18} />} label="Water" value={`${(waterConsumed / 1000).toFixed(1)}L`} detail={`of ${(waterGoal / 1000).toFixed(1)}L goal`} /></div><div className="dashboard-grid"><section className="panel progress-panel"><div className="panel-heading"><div><div className="eyebrow">TODAY'S LOOP</div><h2>Daily progress</h2></div><BarChart3 size={20} className="muted-icon" /></div><div className="rings-row"><div><Ring value={taskProgress} label="tasks" /><span className="ring-caption">Task progress</span></div><div><Ring value={workoutProgress} label="workout" accent="#7de2cb" /><span className="ring-caption">Workout progress</span></div><div><Ring value={calorieProgress} label="fuel" accent="#f0b35c" /><span className="ring-caption">Calorie progress</span></div></div><div className="mini-legend"><span><i className="dot cyan" /> Tasks</span><span><i className="dot mint" /> Workout</span><span><i className="dot gold" /> Fuel</span></div></section><section className="panel summary-panel"><div className="panel-heading"><div><div className="eyebrow">DAILY SUMMARY</div><h2>Macro Balance</h2></div><ChevronRight size={18} className="muted-icon" /></div><div className="donut-wrap"><div className="donut donut-animated" style={{ background: donutGradient }}><div className="donut-hole"><strong>{Math.round(totals.calories)}</strong><span>kcal in</span></div></div><div className="donut-list"><div><i className="dot cyan" /><span>Protein</span><b>{Math.round(totals.protein)}g</b></div><div><i className="dot mint" /><span>Carbs</span><b>{Math.round(totals.carbs)}g</b></div><div><i className="dot gold" /><span>Fat</span><b>{Math.round(totals.fat)}g</b></div></div></div></section></div>
  <section className="panel water-tracker-panel">
    <div className="panel-heading"><div><div className="eyebrow">HYDRATION</div><h2>Water Tracker</h2></div><Droplet size={20} className="muted-icon" /></div>
    <div className="water-tracker-body">
      <div className="water-progress-wrap">
        <Ring value={waterProgress} label="water" accent="#28b8f3" />
        <div className="water-stats">
          <div><span>Consumed</span><b>{(waterConsumed / 1000).toFixed(2)} L</b></div>
          <div><span>Remaining</span><b>{(waterRemaining / 1000).toFixed(2)} L</b></div>
          <div><span>Daily goal</span><b>{(waterGoal / 1000).toFixed(1)} L</b></div>
        </div>
      </div>
      <div className="water-buttons">
        <button className="water-add-btn" onClick={() => onAddWater(250)}><Plus size={16} /> 250ml</button>
        <button className="water-add-btn" onClick={() => onAddWater(500)}><Plus size={16} /> 500ml</button>
        <button className="water-add-btn" onClick={() => onAddWater(1000)}><Plus size={16} /> 1L</button>
      </div>
      {todayWaterLogs.length > 0 && <div className="water-log-list">{todayWaterLogs.slice(0, 6).map((w) => <div className="water-log-row" key={w.id}><Droplet size={14} /><span>{w.amount_ml} ml</span><button className="water-remove-btn" onClick={() => onRemoveWater(w.id)}><Minus size={14} /></button></div>)}</div>}
    </div>
  </section>
  <div className="quick-grid"><button className="quick-card" onClick={() => go('tasks')}><div className="quick-icon"><Check size={19} /></div><div><span>Daily tasks</span><b>{tasks.length ? `${completedTasks} completed` : 'Add your first task'}</b></div><ChevronRight size={17} /></button><button className="quick-card" onClick={() => go('meals')}><div className="quick-icon warm"><Salad size={19} /></div><div><span>Meal progress</span><b>{meals.length ? `${Math.round(totals.calories)} estimated kcal` : 'Log your first meal'}</b></div><ChevronRight size={17} /></button><button className="quick-card" onClick={() => go('streaks')}><div className="quick-icon streak"><Flame size={19} /></div><div><span>Streaks</span><b>Track your consistency</b></div><ChevronRight size={17} /></button></div></div>;
}

function TasksPage({ profile, tasks, workouts, meals, waterLogs, refresh, go }: { profile: Profile; tasks: Task[]; workouts: Workout[]; meals: Meal[]; waterLogs: WaterLog[]; refresh: () => Promise<void>; go: (page: Page) => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('fitness');
  const [priority, setPriority] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await supabase.from('tasks').insert({ title: title.trim() });
    setTitle('');
    await refresh();
    setBusy(false);
  }
  async function toggle(task: Task) { await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id); await refresh(); }
  async function remove(task: Task) { await supabase.from('tasks').delete().eq('id', task.id); await refresh(); }
  async function addSuggestedTask(suggestedTitle: string) {
    if (tasks.some((task) => task.title === suggestedTitle && !task.completed)) return;
    await supabase.from('tasks').insert({ title: suggestedTitle });
    await refresh();
  }

  const todayWorkout = workouts.some((workout) => isToday(workout.created_at));
  const todayMeal = meals.some((meal) => isToday(meal.created_at));
  const waterConsumed = waterLogs.filter((log) => isToday(log.created_at)).reduce((sum, log) => sum + Number(log.amount_ml), 0);
  const waterGoal = calculateWaterGoal(profile);
  const missions = [
    { title: 'Move your body', detail: todayWorkout ? 'Workout logged today' : 'Log any workout to keep your rhythm', done: todayWorkout, icon: <Dumbbell size={17} />, page: 'workouts' as Page, task: 'Complete today’s workout' },
    { title: 'Fuel with intention', detail: todayMeal ? 'Meal logged today' : 'Add breakfast, lunch, dinner, or a snack', done: todayMeal, icon: <Utensils size={17} />, page: 'meals' as Page, task: 'Log a meal for today' },
    { title: 'Hydrate steadily', detail: `${(waterConsumed / 1000).toFixed(1)}L of ${(waterGoal / 1000).toFixed(1)}L logged`, done: waterConsumed >= waterGoal, icon: <Droplet size={17} />, page: 'dashboard' as Page, task: 'Reach today’s water goal' },
    { title: 'Add colour to your plate', detail: 'Try a fruit, vegetable, salad, or corn serving', done: meals.some((meal) => /fruit|vegetable|salad|corn/i.test(meal.food_name)), icon: <Apple size={17} />, page: 'meals' as Page, task: 'Add a fruit or vegetable' },
  ];
  const done = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - done;
  const progress = tasks.length ? done / tasks.length * 100 : 0;
  const filteredTasks = filter === 'all' ? tasks : tasks.filter((task) => task.title.toLowerCase().includes(filter));

  return <div className="page-content narrow-page">
    <div className="page-heading"><div><div className="eyebrow">YOUR DAILY LOOP</div><h1>Tasks</h1><p className="muted">{done} completed / {tasks.length} total · {Math.round(progress)}% complete</p></div><Ring value={progress} label="done" /></div>
    <div className="task-stats-row">
      <div className="task-stat-card"><div className="task-stat-icon"><Target size={16} /></div><div><span>Total</span><b>{tasks.length}</b></div></div>
      <div className="task-stat-card done"><div className="task-stat-icon"><Check size={16} /></div><div><span>Completed</span><b>{done}</b></div></div>
      <div className="task-stat-card pending"><div className="task-stat-icon"><Clock size={16} /></div><div><span>Pending</span><b>{pending}</b></div></div>
    </div>
    <div className="progress-bar-wrap"><div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div><span className="progress-bar-label">{Math.round(progress)}% of today's loop</span></div>
    <section className="panel task-missions-panel">
      <div className="panel-heading"><div><div className="eyebrow">CONNECTED TO YOUR LOOP</div><h2>Today’s missions</h2></div><Sparkles size={19} className="muted-icon" /></div>
      <div className="task-missions-grid">{missions.map((mission) => <div className={`task-mission-card ${mission.done ? 'is-done' : ''}`} key={mission.title}><div className="task-mission-icon">{mission.icon}</div><div className="task-mission-content"><b>{mission.title}</b><span>{mission.detail}</span></div><button className="task-mission-action" disabled={mission.done} onClick={() => mission.done ? undefined : (mission.page === 'dashboard' ? void addSuggestedTask(mission.task) : go(mission.page))}>{mission.done ? <Check size={15} /> : mission.page === 'dashboard' ? <Plus size={15} /> : <ArrowRight size={15} />}</button></div>)}</div>
    </section>
    <section className="panel">
      <form className="add-row" onSubmit={addTask}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a small step for today..." />
        <div className="task-select-group">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="task-select">
            {taskCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="task-select">
            {taskPriorities.map((pri) => <option key={pri.id} value={pri.id}>{pri.label}</option>)}
          </select>
        </div>
        <button className="primary-button icon-button" disabled={busy}><Plus size={18} /></button>
      </form>
      <div className="task-filter-row">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-chip ${filter === 'fitness' ? 'active' : ''}`} onClick={() => setFilter('fitness')}>Fitness</button>
        <button className={`filter-chip ${filter === 'nutrition' ? 'active' : ''}`} onClick={() => setFilter('nutrition')}>Nutrition</button>
        <button className={`filter-chip ${filter === 'wellness' ? 'active' : ''}`} onClick={() => setFilter('wellness')}>Wellness</button>
        <button className={`filter-chip ${filter === 'personal' ? 'active' : ''}`} onClick={() => setFilter('personal')}>Personal</button>
      </div>
      <div className="task-list">
        {filteredTasks.map((task) => {
          const cat = taskCategories.find((c) => task.title.toLowerCase().includes(c.id)) || taskCategories[0];
          const pri = taskPriorities.find((p) => task.title.toLowerCase().includes(p.id)) || taskPriorities[1];
          return <div className={`task-row ${task.completed ? 'is-done' : ''}`} key={task.id} style={{ '--task-accent': cat.color, '--pri-accent': pri.color } as React.CSSProperties}>
            <button className="check-button" onClick={() => toggle(task)}>{task.completed && <Check size={15} />}</button>
            <div className="task-content"><span>{task.title}</span><div className="task-tags"><span className="task-tag" style={{ color: cat.color }}>{cat.label}</span><span className="task-tag" style={{ color: pri.color }}>{pri.label}</span></div></div>
            <button className="delete-button" onClick={() => remove(task)}><X size={16} /></button>
          </div>;
        })}
        {!filteredTasks.length && <div className="empty-state"><Target size={28} /><p>{tasks.length ? 'No tasks match this filter.' : 'Your list is clear. Add one small step to begin.'}</p></div>}
      </div>
    </section>
  </div>;
}

function WorkoutsPage({ profile, workouts, refresh }: { profile: Profile; workouts: Workout[]; refresh: () => Promise<void> }) {
  const [tab, setTab] = useState<'all' | 'weighted' | 'non-weighted'>('all');
  const [selected, setSelected] = useState<Exercise>(workoutLibrary[0]);
  const [form, setForm] = useState({ sets: '3', reps: '10', weight: '20', duration: '20' });
  const completed = workouts.filter((workout) => workout.completed).length;
  const volume = workouts.reduce((sum, workout) => sum + Number(workout.weight) * Number(workout.sets) * Number(workout.reps), 0);

  const filtered = tab === 'all' ? workoutLibrary : workoutLibrary.filter((item) => item.weighted === (tab === 'weighted'));

  async function logWorkout(event: FormEvent) {
    event.preventDefault();
    await supabase.from('workout_logs').insert({ exercise_name: selected.name, category: selected.category, weighted: selected.weighted, sets: Number(form.sets), reps: Number(form.reps), weight: selected.weighted ? Number(form.weight) : 0, duration: Number(form.duration), completed: true });
    await refresh();
  }

  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">TRAINING LOG</div><h1>Workouts</h1><p className="muted">{completed} sessions logged · {Math.round(volume)} kg total volume</p></div><div className="metric-pill"><Flame size={16} /> {workouts.reduce((sum, item) => sum + estimateWorkoutCalories(item, profile), 0)} <small>est. kcal</small></div></div>
    <div className="tab-row">
      <button className={`tab-chip ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Exercises</button>
      <button className={`tab-chip weighted ${tab === 'weighted' ? 'active' : ''}`} onClick={() => setTab('weighted')}><Dumbbell size={14} /> Weighted</button>
      <button className={`tab-chip non-weighted ${tab === 'non-weighted' ? 'active' : ''}`} onClick={() => setTab('non-weighted')}><Activity size={14} /> Non-Weighted</button>
    </div>
    <div className="workout-layout">
      <section className="panel library-panel">
        <div className="panel-heading"><div><div className="eyebrow">EXERCISE LIBRARY</div><h2>Choose exercise</h2></div><Dumbbell size={20} className="muted-icon" /></div>
        <div className="exercise-list">
          {filtered.map((item) => <button key={item.name} className={`exercise-card ${selected.name === item.name ? 'selected' : ''}`} onClick={() => setSelected(item)}>
            <div className="exercise-mark">{item.weighted ? <Dumbbell size={17} /> : <Activity size={17} />}</div>
            <div><b>{item.name}</b><span>{item.category} · {item.weighted ? 'Weighted' : 'Bodyweight'}</span></div>
            <ChevronRight size={16} />
          </button>)}
        </div>
      </section>
      <section className="panel log-panel">
        <div className="eyebrow">LOG THIS SESSION</div>
        <h2>{selected.name}</h2>
        <p className="muted">{selected.weighted ? 'Track weight, sets, and reps.' : 'Track sets, reps, and duration.'}</p>
        <form className="log-form" onSubmit={logWorkout}>
          <label>Sets<input type="number" min="1" value={form.sets} onChange={(event) => setForm({ ...form, sets: event.target.value })} /></label>
          <label>Reps<input type="number" min="1" value={form.reps} onChange={(event) => setForm({ ...form, reps: event.target.value })} /></label>
          {selected.weighted
            ? <label>Weight (kg)<input type="number" min="0" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} /></label>
            : <label>Duration (min)<input type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></label>}
          <button className="primary-button full-button">Save workout <Check size={17} /></button>
        </form>
        <div className="estimate-box"><Timer size={18} /><div><span>Estimated calories</span><b>{estimateWorkoutCalories({ id: '', user_id: '', created_at: '', workout_date: '', location: '', intensity: '', exercise_name: selected.name, category: selected.category, weighted: selected.weighted, completed: true, sets: Number(form.sets), reps: Number(form.reps), weight: Number(form.weight), duration: Number(form.duration) }, profile)} kcal</b></div></div>
        {selected.weighted && <div className="volume-box"><TrendingUp size={18} /><div><span>Total volume</span><b>{Math.round(Number(form.weight) * Number(form.reps) * Number(form.sets))} kg</b></div></div>}
      </section>
    </div>
    <section className="panel history-panel">
      <div className="panel-heading"><h2>Recent sessions</h2><span className="eyebrow">PERSISTED HISTORY</span></div>
      {workouts.slice(0, 8).map((workout) => <div className="history-row" key={workout.id}><div><b>{workout.exercise_name}</b><span>{workout.sets} sets × {workout.reps} reps · {workout.weight ? `${workout.weight} kg` : `${workout.duration} min`}</span></div><strong>{estimateWorkoutCalories(workout, profile)} <small>est. kcal</small></strong></div>)}
      {!workouts.length && <div className="empty-state"><Dumbbell size={28} /><p>Your logged sessions will appear here.</p></div>}
    </section>
  </div>;
}

function MealsPage({ meals, refresh }: { meals: Meal[]; refresh: () => Promise<void> }) {
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Food>(foodLibrary[0]);
  const [quantity, setQuantity] = useState('1');
  const totals = calculateMealTotals(meals);

  async function addMeal(event: FormEvent) {
    event.preventDefault();
    const amount = Number(quantity) || 1;
    await supabase.from('meal_logs').insert({ food_name: selected.name, category: selected.category, quantity: amount, portion_grams: 100, calories: selected.calories * amount, protein: selected.protein * amount, carbs: selected.carbs * amount, fat: selected.fat * amount });
    await refresh();
  }

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const cuisines = ['all', 'Indian', 'South Indian', 'Multi-cuisine'];
  const filteredFoods = foodLibrary.filter((food) => (cuisineFilter === 'all' || food.cuisine === cuisineFilter) && (categoryFilter === 'all' || food.category === categoryFilter));

  return <div className="page-content">
    <div className="page-heading"><div><div className="eyebrow">NUTRITION LOG</div><h1>Meals</h1><p className="muted">Fuel your day with awareness, not extremes.</p></div><div className="metric-pill warm-pill"><Apple size={16} /> {Math.round(totals.calories)} <small>est. kcal today</small></div></div>
    <div className="tab-row">
      {cuisines.map((cuisine) => <button key={cuisine} className={`tab-chip ${cuisineFilter === cuisine ? 'active' : ''}`} onClick={() => setCuisineFilter(cuisine)}>{cuisine === 'all' ? 'All Cuisines' : cuisine}</button>)}
    </div>
    <div className="category-tabs">
      {['all', ...categories].map((cat) => <button key={cat} className={`category-chip ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>{cat === 'all' ? 'All Meals' : cat}</button>)}
    </div>
    <div className="meal-layout">
      <section className="panel food-panel">
        <div className="panel-heading"><div><div className="eyebrow">FOOD LIBRARY</div><h2>Choose food</h2></div><Utensils size={20} className="muted-icon" /></div>
        <div className="food-list">
          {filteredFoods.map((food) => <button className={`food-card ${selected.name === food.name ? 'selected' : ''}`} key={food.name} onClick={() => setSelected(food)}>
            <div className="food-mark"><Salad size={17} /></div>
            <div><b>{food.name}</b><span>{food.category} · {food.cuisine} · {food.calories} kcal / 100g</span></div>
            <ChevronRight size={16} />
          </button>)}
          {!filteredFoods.length && <div className="empty-state"><Salad size={28} /><p>No foods match this filter.</p></div>}
        </div>
      </section>
      <section className="panel log-panel">
        <div className="eyebrow">ADD TO TODAY</div>
        <h2>{selected.name}</h2>
        <p className="muted">{selected.cuisine} · {selected.category} · Estimated per 100g portion</p>
        <form className="log-form" onSubmit={addMeal}>
          <label>Quantity (100g portions)<input type="number" min="0.25" step="0.25" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
          <div className="nutrition-preview">
            <div><b>{Math.round(selected.calories * Number(quantity || 0))}</b><span>Estimated calories</span></div>
            <div><b>{Math.round(selected.protein * Number(quantity || 0))}g</b><span>Protein</span></div>
            <div><b>{Math.round(selected.carbs * Number(quantity || 0))}g</b><span>Carbs</span></div>
            <div><b>{Math.round(selected.fat * Number(quantity || 0))}g</b><span>Fat</span></div>
          </div>
          <button className="primary-button full-button">Add meal <Plus size={17} /></button>
        </form>
      </section>
    </div>
    <section className="panel meal-history">
      <div className="panel-heading"><h2>Today's meals</h2><span className="eyebrow">ESTIMATED TOTALS</span></div>
      <div className="meal-total-grid">{categories.map((category) => { const value = meals.filter((meal) => meal.category === category).reduce((sum, meal) => sum + Number(meal.calories), 0); return <div key={category}><span>{category}</span><b>{Math.round(value)} <small>kcal</small></b></div>; })}<div className="daily-total-cell"><span>Daily total</span><b>{Math.round(totals.calories)} <small>kcal</small></b></div></div>
      {meals.slice(0, 8).map((meal) => <div className="history-row" key={meal.id}><div><b>{meal.food_name}</b><span>{meal.category} · {meal.quantity} × 100g</span></div><strong>{Math.round(meal.calories)} <small>est. kcal</small></strong></div>)}
      {!meals.length && <div className="empty-state"><Salad size={28} /><p>Your food log is ready for its first entry.</p></div>}
    </section>
  </div>;
}

function getDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateStreaks(tasks: Task[], workouts: Workout[], meals: Meal[], waterLogs: WaterLog[]) {
  const allDates = new Set<string>();
  tasks.forEach((t) => { if (t.completed) allDates.add(getDateStr(new Date(t.created_at))); });
  workouts.forEach((w) => { if (w.completed) allDates.add(getDateStr(new Date(w.created_at))); });
  meals.forEach((m) => allDates.add(getDateStr(new Date(m.created_at))));
  waterLogs.forEach((w) => allDates.add(getDateStr(new Date(w.created_at))));

  const sortedDates = Array.from(allDates).sort();

  let currentDaily = 0;
  let bestDaily = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    if (prevDate) {
      const diff = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        bestDaily = Math.max(bestDaily, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = d;
  }
  bestDaily = Math.max(bestDaily, tempStreak);

  const lastActivity = sortedDates.length ? new Date(sortedDates[sortedDates.length - 1]) : null;
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    if (lastActivity.getTime() === today.getTime() || lastActivity.getTime() === yesterday.getTime()) {
      currentDaily = tempStreak;
    }
  }

  const weeklySets = new Map<string, boolean>();
  sortedDates.forEach((dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const week = Math.floor((d.getTime() - new Date(year, 0, 1).getTime()) / 604800000);
    weeklySets.set(`${year}-W${week}`, true);
  });
  const completedWeeks = weeklySets.size;

  const monthlySets = new Map<string, boolean>();
  sortedDates.forEach((dateStr) => {
    const d = new Date(dateStr);
    monthlySets.set(`${d.getFullYear()}-${d.getMonth()}`, true);
  });
  const completedMonths = monthlySets.size;

  const yearlySets = new Map<string, boolean>();
  sortedDates.forEach((dateStr) => {
    const d = new Date(dateStr);
    yearlySets.set(`${d.getFullYear()}`, true);
  });
  const completedYears = yearlySets.size;

  return { currentDaily, bestDaily, completedWeeks, completedMonths, completedYears, totalActiveDays: sortedDates.length };
}

function getStreakReward(streak: number): { label: string; points: number } | null {
  if (streak >= 365) return { label: '1-Year Milestone', points: 1000 };
  if (streak >= 90) return { label: '3-Month Milestone', points: 500 };
  if (streak >= 30) return { label: '30-Day Milestone', points: 300 };
  if (streak >= 14) return { label: '14-Day Bonus', points: 150 };
  if (streak >= 7) return { label: '7-Day Bonus', points: 100 };
  if (streak >= 3) return { label: '3-Day Reward', points: 50 };
  return null;
}

function StreaksPage({ profile, tasks, workouts, meals, waterLogs }: { profile: Profile; tasks: Task[]; workouts: Workout[]; meals: Meal[]; waterLogs: WaterLog[] }) {
  const streaks = calculateStreaks(tasks, workouts, meals, waterLogs);
  const reward = getStreakReward(streaks.currentDaily);
  const totalPoints = tasks.filter((t) => t.completed).length * 10 + streaks.currentDaily * 5;

  const [certAwarded, setCertAwarded] = useState(profile.seven_day_certificate_awarded || false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showCertView, setShowCertView] = useState(false);

  useEffect(() => {
    if (streaks.currentDaily >= 7 && !certAwarded) {
      void supabase.from('profiles').update({ seven_day_certificate_awarded: true }).eq('id', profile.id).then(() => {
        setCertAwarded(true);
        setShowCertModal(true);
      });
    }
  }, [streaks.currentDaily, certAwarded, profile.id]);

  const certId = `LF-7D-${profile.id.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;
  const certDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return <div className="page-content narrow-page">
    <div className="page-heading"><div><div className="eyebrow">CONSISTENCY</div><h1>Streaks & Progress</h1><p className="muted">Your history, tracked by real dates.</p></div><div className="streak-hero"><Flame size={28} /><b>{streaks.currentDaily}</b><span>day streak</span></div></div>
    <div className="streak-stats-grid">
      <div className="streak-stat-card"><div className="streak-stat-icon"><Flame size={18} /></div><div><span>Current Streak</span><b>{streaks.currentDaily} days</b></div></div>
      <div className="streak-stat-card best"><div className="streak-stat-icon"><TrendingUp size={18} /></div><div><span>Best Streak</span><b>{streaks.bestDaily} days</b></div></div>
      <div className="streak-stat-card"><div className="streak-stat-icon"><Target size={18} /></div><div><span>Total Active Days</span><b>{streaks.totalActiveDays}</b></div></div>
      <div className="streak-stat-card"><div className="streak-stat-icon"><Zap size={18} /></div><div><span>Points Earned</span><b>{totalPoints}</b></div></div>
    </div>

    {certAwarded && <section className="panel certificate-panel">
      <div className="certificate-badge"><Award size={24} /></div>
      <div className="certificate-info"><b>7-Day Streak Certificate</b><span>Awarded for your first 7-day continuous streak</span></div>
      <button className="outline-button" onClick={() => setShowCertView(true)}>View Certificate</button>
    </section>}

    <div className="streak-section-grid">
      <section className="panel streak-panel">
        <div className="panel-heading"><div><div className="eyebrow">WEEKLY</div><h2>Weekly Streaks</h2></div></div>
        <div className="streak-info-row"><span>Completed weeks</span><b>{streaks.completedWeeks}</b></div>
        <div className="streak-info-row"><span>Current week progress</span><b>{streaks.currentDaily > 0 ? 'Active' : '—'}</b></div>
      </section>
      <section className="panel streak-panel">
        <div className="panel-heading"><div><div className="eyebrow">MONTHLY</div><h2>Monthly Streaks</h2></div></div>
        <div className="streak-info-row"><span>Completed months</span><b>{streaks.completedMonths}</b></div>
        <div className="streak-info-row"><span>Best monthly streak</span><b>{streaks.completedMonths}</b></div>
      </section>
      <section className="panel streak-panel">
        <div className="panel-heading"><div><div className="eyebrow">YEARLY</div><h2>Yearly History</h2></div></div>
        <div className="streak-info-row"><span>Completed years</span><b>{streaks.completedYears}</b></div>
        <div className="streak-info-row"><span>Current year</span><b>{new Date().getFullYear()}</b></div>
      </section>
      <section className="panel streak-panel">
        <div className="panel-heading"><div><div className="eyebrow">REWARDS</div><h2>Streak Rewards</h2></div></div>
        {reward ? <div className="streak-reward-row"><Flame size={18} /><div><b>{reward.label}</b><span>+{reward.points} points</span></div></div> : <div className="streak-info-row"><span>Next reward at</span><b>3-day streak</b></div>}
        <div className="streak-reward-list">
          <div className={streaks.currentDaily >= 3 ? 'active' : ''}><Flame size={14} /> 3 days → +50 pts</div>
          <div className={streaks.currentDaily >= 7 ? 'active' : ''}><Flame size={14} /> 7 days → +100 pts</div>
          <div className={streaks.currentDaily >= 14 ? 'active' : ''}><Flame size={14} /> 14 days → +150 pts</div>
          <div className={streaks.currentDaily >= 30 ? 'active' : ''}><Flame size={14} /> 30 days → +300 pts</div>
          <div className={streaks.currentDaily >= 90 ? 'active' : ''}><Flame size={14} /> 3 months → +500 pts</div>
          <div className={streaks.currentDaily >= 365 ? 'active' : ''}><Flame size={14} /> 1 year → +1000 pts</div>
        </div>
      </section>
    </div>
    <section className="panel streak-panel">
      <div className="panel-heading"><div><div className="eyebrow">DAILY HISTORY</div><h2>Recent Activity</h2></div></div>
      <div className="streak-history-list">
        {Array.from(new Set([...meals.map((m) => getDateStr(new Date(m.created_at))), ...workouts.map((w) => getDateStr(new Date(w.created_at))), ...waterLogs.map((w) => getDateStr(new Date(w.created_at)))])).sort().reverse().slice(0, 14).map((dateStr) => {
          const dayMeals = meals.filter((m) => getDateStr(new Date(m.created_at)) === dateStr);
          const dayWorkouts = workouts.filter((w) => getDateStr(new Date(w.created_at)) === dateStr);
          const dayWater = waterLogs.filter((w) => getDateStr(new Date(w.created_at)) === dateStr);
          const dayCalories = dayMeals.reduce((s, m) => s + Number(m.calories), 0);
          const dayBurn = dayWorkouts.reduce((s, w) => s + estimateWorkoutCalories(w, profile), 0);
          const dayWaterMl = dayWater.reduce((s, w) => s + Number(w.amount_ml), 0);
          return <div className="streak-history-row" key={dateStr}>
            <div className="streak-history-date"><b>{new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b></div>
            <div className="streak-history-stats">
              <span><Flame size={13} /> {Math.round(dayCalories)} kcal</span>
              <span><Dumbbell size={13} /> {dayBurn} kcal</span>
              <span><Droplet size={13} /> {(dayWaterMl / 1000).toFixed(1)}L</span>
              <span><Check size={13} /> {dayMeals.length + dayWorkouts.length} logs</span>
            </div>
          </div>;
        })}
        {!meals.length && !workouts.length && !waterLogs.length && <div className="empty-state"><Flame size={28} /><p>No history yet. Start logging to build your streak.</p></div>}
      </div>
    </section>

    {/* Celebration modal for first 7-day certificate */}
    {showCertModal && <div className="cert-modal-overlay" onClick={() => setShowCertModal(false)}>
      <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cert-modal-icon"><Award size={40} /></div>
        <h2>7-Day Streak Complete!</h2>
        <p>Your first 7-day streak certificate has been unlocked.</p>
        <div className="cert-modal-actions">
          <button className="primary-button" onClick={() => { setShowCertModal(false); setShowCertView(true); }}>View Certificate</button>
          <button className="text-button" onClick={() => setShowCertModal(false)}>Later</button>
        </div>
      </div>
    </div>}

    {/* Full certificate view */}
    {showCertView && <div className="cert-modal-overlay" onClick={() => setShowCertView(false)}>
      <div className="cert-document" onClick={(e) => e.stopPropagation()}>
        <button className="cert-close-btn" onClick={() => setShowCertView(false)}><X size={20} /></button>
        <div className="cert-document-inner">
          <div className="cert-logo"><img src="/ChatGPT_Image_Sep_23,_2026,_07_54_43_PM.png" alt="Loop Fit" /><span>LOOP <b>FIT</b></span></div>
          <div className="cert-eyebrow">CERTIFICATE OF ACHIEVEMENT</div>
          <h2>7-Day Streak Achievement</h2>
          <p className="cert-congrats">Congratulations!</p>
          <p className="cert-body">This certifies that <b>{profile.name}</b> has successfully completed a continuous 7-day streak of fitness activity on Loop Fit.</p>
          <div className="cert-meta-row">
            <div><span>Achievement Date</span><b>{certDate}</b></div>
            <div><span>Reference ID</span><b>{certId}</b></div>
          </div>
          <div className="cert-seal"><Award size={32} /></div>
          <p className="cert-footer">Small steps. Stronger you.</p>
        </div>
      </div>
    </div>}
  </div>;
}

function AppShell({ profile, onSignOut }: { profile: Profile; onSignOut: () => Promise<void> }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);

  async function refresh() {
    const [taskResult, workoutResult, mealResult, waterResult] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('workout_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('meal_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('water_logs').select('*').order('created_at', { ascending: false }),
    ]);
    setTasks(taskResult.data || []);
    setWorkouts(workoutResult.data || []);
    setMeals(mealResult.data || []);
    setWaterLogs(waterResult.data || []);
  }
  useEffect(() => { void refresh(); }, []);

  async function addWater(ml: number) {
    await supabase.from('water_logs').insert({ amount_ml: ml });
    await refresh();
  }
  async function removeWater(id: string) {
    await supabase.from('water_logs').delete().eq('id', id);
    await refresh();
  }

  const nav = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as Page, label: 'Tasks', icon: Check },
    { id: 'workouts' as Page, label: 'Workouts', icon: Dumbbell },
    { id: 'meals' as Page, label: 'Meals', icon: Utensils },
    { id: 'streaks' as Page, label: 'Streaks', icon: Flame },
  ];

  function go(next: Page) { setPage(next); setMobileOpen(false); }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-top"><Logo compact /><button className="close-menu" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button className={page === id ? 'active' : ''} key={id} onClick={() => go(id)}><Icon size={18} /><span>{label}</span>{page === id && <ChevronRight size={15} />}</button>)}</nav>
      <div className="sidebar-foot"><div className="profile-mini"><div className="avatar">{profile.name.charAt(0).toUpperCase() || 'L'}</div><div><b>{profile.name || 'Loop member'}</b><span>{profile.workout_experience}</span></div></div><button className="signout" onClick={onSignOut}><LogOut size={16} /> Sign out</button></div>
    </aside>
    {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <main className="main-shell">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><Logo compact /><div className="topbar-right"><span className="status-dot" /> <span>Loop active</span><button className="profile-button"><CircleUserRound size={20} /></button></div></header>
      {page === 'dashboard' && <Dashboard profile={profile} tasks={tasks} workouts={workouts} meals={meals} waterLogs={waterLogs} go={go} onAddWater={addWater} onRemoveWater={removeWater} />}
      {page === 'tasks' && <TasksPage profile={profile} tasks={tasks} workouts={workouts} meals={meals} waterLogs={waterLogs} refresh={refresh} go={go} />}
      {page === 'workouts' && <ScreenshotWorkoutPage profile={profile} workouts={workouts} refresh={refresh} />}
      {page === 'meals' && <ScreenshotMealPage meals={meals} refresh={refresh} />}
      {page === 'streaks' && <StreaksPage profile={profile} tasks={tasks} workouts={workouts} meals={meals} waterLogs={waterLogs} />}
    </main>
  </div>;
}

function App() {
  const [splash, setSplash] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 1800);
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      (async () => { setSession(nextSession); if (!nextSession) setProfile(null); })();
    });
    return () => { window.clearTimeout(timer); listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) return;
    void supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [session]);

  async function signOut() { await supabase.auth.signOut(); setSession(null); setProfile(null); }

  if (splash) return <Splash />;
  if (loading) return <Splash />;
  if (!session) return <AuthScreen />;
  if (!profile) return <ProfileSetup userId={session.user.id} onDone={setProfile} />;
  return <AppShell profile={profile} onSignOut={signOut} />;
}

export default App;
