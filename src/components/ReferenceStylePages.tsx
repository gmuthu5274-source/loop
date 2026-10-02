import { FormEvent, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, Camera, Check, Dumbbell, ImageIcon, Loader2, Pencil, Plus, Search, Trash2, Utensils, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types';
import { bowlSizes, foodDatabase, foodEmoji, foodServingSize, type Food } from '@/lib/foodDatabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Workout = Database['public']['Tables']['workout_logs']['Row'];
type Meal = Database['public']['Tables']['meal_logs']['Row'];

type Exercise = { name: string; category: string; weighted: boolean };

const exercises: Exercise[] = [
  // Weighted — Lower Body
  { name: 'Barbell Squat', category: 'Lower Body', weighted: true },
  { name: 'Barbell Deadlift', category: 'Lower Body', weighted: true },
  { name: 'Leg Press', category: 'Lower Body', weighted: true },
  { name: 'Romanian Deadlift', category: 'Lower Body', weighted: true },
  { name: 'Leg Curl', category: 'Lower Body', weighted: true },
  { name: 'Leg Extension', category: 'Lower Body', weighted: true },
  { name: 'Calf Raise', category: 'Lower Body', weighted: true },
  { name: 'Barbell Hip Thrust', category: 'Lower Body', weighted: true },
  { name: 'Goblet Squat', category: 'Lower Body', weighted: true },
  { name: 'Bulgarian Split Squat', category: 'Lower Body', weighted: true },
  { name: 'Hack Squat', category: 'Lower Body', weighted: true },
  { name: 'Walking Lunge (Dumbbell)', category: 'Lower Body', weighted: true },
  // Weighted — Chest
  { name: 'Bench Press', category: 'Chest', weighted: true },
  { name: 'Incline Dumbbell Press', category: 'Chest', weighted: true },
  { name: 'Cable Fly', category: 'Chest', weighted: true },
  { name: 'Decline Bench Press', category: 'Chest', weighted: true },
  { name: 'Machine Chest Press', category: 'Chest', weighted: true },
  { name: 'Dumbbell Pullover', category: 'Chest', weighted: true },
  // Weighted — Back
  { name: 'Lat Pulldown', category: 'Back', weighted: true },
  { name: 'Barbell Row', category: 'Back', weighted: true },
  { name: 'Cable Row', category: 'Back', weighted: true },
  { name: 'T-Bar Row', category: 'Back', weighted: true },
  { name: 'Seated Row Machine', category: 'Back', weighted: true },
  { name: 'Straight Arm Pulldown', category: 'Back', weighted: true },
  // Weighted — Shoulders
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders', weighted: true },
  { name: 'Dumbbell Lateral Raise', category: 'Shoulders', weighted: true },
  { name: 'Face Pull', category: 'Shoulders', weighted: true },
  { name: 'Barbell Overhead Press', category: 'Shoulders', weighted: true },
  { name: 'Cable Lateral Raise', category: 'Shoulders', weighted: true },
  { name: 'Rear Delt Fly', category: 'Shoulders', weighted: true },
  // Weighted — Arms
  { name: 'Bicep Curl', category: 'Arms', weighted: true },
  { name: 'Hammer Curl', category: 'Arms', weighted: true },
  { name: 'Tricep Extension', category: 'Arms', weighted: true },
  { name: 'Preacher Curl', category: 'Arms', weighted: true },
  { name: 'Skull Crusher', category: 'Arms', weighted: true },
  { name: 'Cable Pushdown', category: 'Arms', weighted: true },
  { name: 'Concentration Curl', category: 'Arms', weighted: true },
  { name: 'Wrist Curl', category: 'Arms', weighted: true },
  // Non-weighted — Bodyweight
  { name: 'Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Diamond Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Pike Push Ups', category: 'Bodyweight', weighted: false },
  { name: 'Pull Ups', category: 'Bodyweight', weighted: false },
  { name: 'Chin Ups', category: 'Bodyweight', weighted: false },
  { name: 'Bodyweight Squat', category: 'Bodyweight', weighted: false },
  { name: 'Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Glute Bridge', category: 'Bodyweight', weighted: false },
  { name: 'Wall Sit', category: 'Bodyweight', weighted: false },
  { name: 'Reverse Lunges', category: 'Bodyweight', weighted: false },
  { name: 'Calf Raises (Bodyweight)', category: 'Bodyweight', weighted: false },
  { name: 'Step Ups', category: 'Bodyweight', weighted: false },
  // Non-weighted — Core
  { name: 'Plank', category: 'Core', weighted: false },
  { name: 'Sit Ups', category: 'Core', weighted: false },
  { name: 'Russian Twists', category: 'Core', weighted: false },
  { name: 'Leg Raises', category: 'Core', weighted: false },
  { name: 'Bicycle Crunches', category: 'Core', weighted: false },
  { name: 'Side Plank', category: 'Core', weighted: false },
  { name: 'Flutter Kicks', category: 'Core', weighted: false },
  { name: 'Hollow Hold', category: 'Core', weighted: false },
  { name: 'V-Ups', category: 'Core', weighted: false },
  { name: 'Dead Bug', category: 'Core', weighted: false },
  // Non-weighted — Cardio
  { name: 'Burpees', category: 'Cardio', weighted: false },
  { name: 'Mountain Climbers', category: 'Cardio', weighted: false },
  { name: 'Jumping Jacks', category: 'Cardio', weighted: false },
  { name: 'High Knees', category: 'Cardio', weighted: false },
  { name: 'Jump Rope', category: 'Cardio', weighted: false },
  { name: 'Squat Jumps', category: 'Cardio', weighted: false },
  { name: 'Box Jumps', category: 'Cardio', weighted: false },
  { name: 'Tuck Jumps', category: 'Cardio', weighted: false },
  { name: 'Running (Treadmill)', category: 'Cardio', weighted: false },
  { name: 'Cycling (Stationary)', category: 'Cardio', weighted: false },
  { name: 'Rowing Machine', category: 'Cardio', weighted: false },
  { name: 'Stair Climber', category: 'Cardio', weighted: false },
  // Non-weighted — Yoga / Flexibility
  { name: 'Sun Salutation', category: 'Yoga', weighted: false },
  { name: 'Downward Dog', category: 'Yoga', weighted: false },
  { name: 'Warrior Pose', category: 'Yoga', weighted: false },
  { name: 'Cobra Stretch', category: 'Yoga', weighted: false },
  { name: 'Pigeon Pose', category: 'Yoga', weighted: false },
  { name: 'Child Pose', category: 'Yoga', weighted: false },
  { name: 'Triangle Pose', category: 'Yoga', weighted: false },
  { name: 'Bridge Pose', category: 'Yoga', weighted: false },
  { name: 'Safety Bar Squat', category: 'Lower Body', weighted: true },
  { name: 'Good Morning', category: 'Lower Body', weighted: true },
  { name: 'Cable Pull Through', category: 'Lower Body', weighted: true },
  { name: 'Chest Supported Row', category: 'Back', weighted: true },
  { name: 'Single Arm Cable Row', category: 'Back', weighted: true },
  { name: 'Landmine Press', category: 'Shoulders', weighted: true },
  { name: 'Cable Upright Row', category: 'Shoulders', weighted: true },
  { name: 'Incline Cable Curl', category: 'Arms', weighted: true },
  { name: 'Dumbbell Floor Press', category: 'Chest', weighted: true },
  { name: 'Kettlebell Clean and Press', category: 'Full Body', weighted: true },
  { name: 'Bear Plank', category: 'Core', weighted: false },
  { name: 'Crab Toe Touches', category: 'Core', weighted: false },
  { name: 'Knee Tucks', category: 'Core', weighted: false },
  { name: 'Lateral Bounds', category: 'Cardio', weighted: false },
  { name: 'Skater Hops', category: 'Cardio', weighted: false },
  { name: 'Fast Feet', category: 'Cardio', weighted: false },
  { name: 'Inchworm Walkout', category: 'Mobility', weighted: false },
  { name: 'Worlds Greatest Stretch', category: 'Mobility', weighted: false },
  { name: '90/90 Hip Switch', category: 'Mobility', weighted: false },
  { name: 'Thoracic Rotation', category: 'Mobility', weighted: false },
];

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const foodCategoryOptions = ['Pasta', 'Rice', 'Chicken', 'Eggs', 'Bread', 'Fruits', 'Vegetables', 'Beverages', 'Snacks', 'Fish', 'Salads', 'Corn', 'South Indian Breakfast', 'South Indian Meals (Lunch/Dinner)', 'South Indian Snacks', 'South Indian Non-Veg', 'Indian'];
const foodCategoryIcons: Record<string, string> = { Pasta: '🍝', Rice: '🍚', Chicken: '🍗', Eggs: '🥚', Bread: '🍞', Fruits: '🍎', Vegetables: '🥦', Beverages: '🥤', Snacks: '🥨', Fish: '🐟', Salads: '🥗', Corn: '🌽', 'South Indian Breakfast': '🍛', 'South Indian Meals (Lunch/Dinner)': '🍲', 'South Indian Snacks': '🥟', 'South Indian Non-Veg': '🍗', Indian: '🍽️' };
type MealType = typeof mealTypes[number];

function estimateCalories(weight: number, duration: number, weighted: boolean) {
  return Math.round(((weighted ? 6 : 5) * 3.5 * (weight || 70) / 200) * duration);
}

export function ScreenshotWorkoutPage({ profile, workouts, refresh }: { profile: Profile; workouts: Workout[]; refresh: () => Promise<void> }) {
  const [selectedWeighted, setSelectedWeighted] = useState<Exercise | null>(null);
  const [selectedBodyweight, setSelectedBodyweight] = useState<Exercise | null>(null);
  const [weightedForm, setWeightedForm] = useState({ sets: '3', reps: '12', weight: '50', location: 'Gym' });
  const [bodyweightForm, setBodyweightForm] = useState({ duration: '30', intensity: 'Moderate', location: 'Outdoor' });

  const weightedExercises = exercises.filter((exercise) => exercise.weighted);
  const bodyweightExercises = exercises.filter((exercise) => !exercise.weighted);
  const weightedCalories = selectedWeighted ? estimateCalories(Number(profile.weight), Number(weightedForm.sets) * 4 + Number(weightedForm.reps) * .15, true) : 0;
  const bodyweightCalories = selectedBodyweight ? estimateCalories(Number(profile.weight), Number(bodyweightForm.duration), false) : 0;

  async function logWeighted(event: FormEvent) {
    event.preventDefault();
    if (!selectedWeighted) return;
    await supabase.from('workout_logs').insert({ exercise_name: selectedWeighted.name, category: selectedWeighted.category, weighted: true, sets: Number(weightedForm.sets), reps: Number(weightedForm.reps), weight: Number(weightedForm.weight), duration: Number(weightedForm.sets) * 4, completed: true, location: weightedForm.location, intensity: 'Vigorous' });
    await refresh();
  }

  async function logBodyweight(event: FormEvent) {
    event.preventDefault();
    if (!selectedBodyweight) return;
    await supabase.from('workout_logs').insert({ exercise_name: selectedBodyweight.name, category: selectedBodyweight.category, weighted: false, sets: 0, reps: 0, weight: 0, duration: Number(bodyweightForm.duration), completed: true, location: bodyweightForm.location, intensity: bodyweightForm.intensity });
    await refresh();
  }

  return <div className="reference-page-content">
    <div className="reference-page-heading"><div><div className="reference-title-icon"><Dumbbell size={24} /></div><h1>Workout Log</h1></div></div>
    <div className="reference-workout-grid">
      <section className="reference-card workout-entry-card">
        <div className="reference-card-heading"><h2><Dumbbell size={19} /> Weight Workout</h2><button className="reference-add-button" onClick={() => setSelectedWeighted(null)}><Plus size={16} /> Add</button></div>
        <form onSubmit={logWeighted} className="reference-form">
          <label>Exercise<select value={selectedWeighted?.name || ''} onChange={(event) => setSelectedWeighted(weightedExercises.find((exercise) => exercise.name === event.target.value) || null)}><option value="">Select exercise</option>{weightedExercises.map((exercise) => <option key={exercise.name} value={exercise.name}>{exercise.name}</option>)}</select></label>
          <div className="reference-three-fields"><label>Sets<input type="number" min="1" value={weightedForm.sets} onChange={(event) => setWeightedForm({ ...weightedForm, sets: event.target.value })} /></label><label>Reps<input type="number" min="1" value={weightedForm.reps} onChange={(event) => setWeightedForm({ ...weightedForm, reps: event.target.value })} /></label><label>kg<input type="number" min="0" value={weightedForm.weight} onChange={(event) => setWeightedForm({ ...weightedForm, weight: event.target.value })} /></label></div>
          <label>Location<select value={weightedForm.location} onChange={(event) => setWeightedForm({ ...weightedForm, location: event.target.value })}><option>Gym</option><option>Home</option><option>Studio</option></select></label>
          <button className="reference-log-button" type="submit"><Check size={16} /> Log Workout</button>
          {selectedWeighted && <div className="reference-estimate">Estimated {weightedCalories} kcal · {Number(weightedForm.sets) * Number(weightedForm.reps) * Number(weightedForm.weight)} kg volume</div>}
        </form>
      </section>
      <section className="reference-card workout-entry-card">
        <div className="reference-card-heading"><h2><Activity size={20} /> Non-Weight Workout</h2><button className="reference-add-button" onClick={() => setSelectedBodyweight(null)}><Plus size={16} /> Add</button></div>
        <form onSubmit={logBodyweight} className="reference-form">
          <label>Exercise<select value={selectedBodyweight?.name || ''} onChange={(event) => setSelectedBodyweight(bodyweightExercises.find((exercise) => exercise.name === event.target.value) || null)}><option value="">Select exercise</option>{bodyweightExercises.map((exercise) => <option key={exercise.name} value={exercise.name}>{exercise.name}</option>)}</select></label>
          <div className="reference-two-fields"><label>Duration (min)<input type="number" min="1" value={bodyweightForm.duration} onChange={(event) => setBodyweightForm({ ...bodyweightForm, duration: event.target.value })} /></label><label>Intensity<select value={bodyweightForm.intensity} onChange={(event) => setBodyweightForm({ ...bodyweightForm, intensity: event.target.value })}><option>Light</option><option>Moderate</option><option>Vigorous</option></select></label></div>
          <label>Location<select value={bodyweightForm.location} onChange={(event) => setBodyweightForm({ ...bodyweightForm, location: event.target.value })}><option>Outdoor</option><option>Home</option><option>Gym</option><option>Studio</option></select></label>
          <button className="reference-log-button" type="submit"><Check size={16} /> Log Workout</button>
          {selectedBodyweight && <div className="reference-estimate">Estimated {bodyweightCalories} kcal · {bodyweightForm.intensity} effort</div>}
        </form>
      </section>
    </div>
    <section className="reference-card reference-history-card"><div className="reference-card-heading"><h2>Recent workouts</h2><span>{workouts.length} logged</span></div>{workouts.slice(0, 8).map((workout) => <div className="reference-history-row" key={workout.id}><div><b>{workout.exercise_name}</b><small>{workout.weighted ? `${workout.sets} sets × ${workout.reps} reps · ${workout.weight} kg` : `${workout.duration} min · ${workout.intensity}`}</small></div><div className="reference-history-right"><strong>{workout.location}</strong><button className="reference-delete-btn" onClick={() => { if (confirm('Delete this workout?')) { void supabase.from('workout_logs').delete().eq('id', workout.id).then(() => refresh()); } }}><Trash2 size={14} /></button></div></div>)}{!workouts.length && <div className="reference-empty">Choose an exercise above to log your first workout.</div>}</section>
  </div>;
}

type PhotoComponent = {
  foodName: string;
  cuisine: string;
  category: string;
  quantity: number;
  servingUnit: string;
  size: string;
  cookingMethod: string;
  oilLevel: string;
  sugarLevel: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type PhotoAnalysis = {
  components: PhotoComponent[];
  totalEstimatedCalories: number;
  confidence: string;
  notes: string;
};

const sizeMultipliers: Record<string, number> = { Small: 0.75, Medium: 1, Large: 1.35 };
const oilMultipliers: Record<string, number> = { Low: 1, Medium: 1.1, High: 1.25 };
const sugarMultipliers: Record<string, number> = { Low: 1, Medium: 1.08, High: 1.15, None: 1 };

function recalcComponentCalories(c: PhotoComponent): number {
  const sizeMult = sizeMultipliers[c.size] ?? 1;
  const oilMult = oilMultipliers[c.oilLevel] ?? 1;
  const sugarMult = sugarMultipliers[c.sugarLevel] ?? 1;
  return Math.round(c.estimatedCalories * c.quantity * sizeMult * oilMult * sugarMult);
}

export function ScreenshotMealPage({ meals, refresh }: { meals: Meal[]; refresh: () => Promise<void> }) {
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [cuisine, setCuisine] = useState<string>('all');
  const [foodCategory, setFoodCategory] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [bowlSize, setBowlSize] = useState('1 cup');
  const [searchQuery, setSearchQuery] = useState('');

  // Photo analysis state
  const [showPhotoUI, setShowPhotoUI] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [editingComponents, setEditingComponents] = useState<PhotoComponent[]>([]);
  const [photoMealType, setPhotoMealType] = useState<MealType>('Lunch');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const foodsForType = useMemo(() => foodDatabase.filter((food) => food.mealType === mealType), [mealType]);
  const cuisinesForType = useMemo(() => {
    const set = new Set(foodsForType.map((food) => food.cuisine));
    const indianRegions = new Set(['Indian', 'North Indian', 'South Indian', 'East Indian', 'West Indian']);
    return ['all', 'Indian', ...Array.from(set).filter((option) => !indianRegions.has(option))];
  }, [foodsForType]);
  const filteredFoods = useMemo(() => {
    let result = foodsForType.filter((food) => {
      const matchesCuisine = cuisine === 'all' || (cuisine === 'Indian' ? food.cuisine === 'Indian' || food.cuisine.endsWith(' Indian') : food.cuisine === cuisine);
      return matchesCuisine && (foodCategory === 'all' || food.category === foodCategory);
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((food) =>
        food.name.toLowerCase().includes(q) ||
        food.cuisine.toLowerCase().includes(q) ||
        food.category.toLowerCase().includes(q) ||
        food.mealType.toLowerCase().includes(q)
      );
    }
    return result;
  }, [foodsForType, cuisine, foodCategory, searchQuery]);
  const currentFood = selectedFood && filteredFoods.some((food) => food.name === selectedFood.name) ? selectedFood : filteredFoods[0] || null;
  const bowlMultiplier = bowlSizes.find((bowl) => bowl.label === bowlSize)?.multiplier ?? 1;
  const estimatedCalories = currentFood ? Math.round(currentFood.caloriesPerCup * bowlMultiplier) : 0;
  const estimatedProtein = currentFood ? Math.round(currentFood.proteinPerCup * bowlMultiplier * 10) / 10 : 0;
  const estimatedCarbs = currentFood ? Math.round(currentFood.carbsPerCup * bowlMultiplier * 10) / 10 : 0;
  const estimatedFat = currentFood ? Math.round(currentFood.fatPerCup * bowlMultiplier * 10) / 10 : 0;
  const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);

  // Photo analysis derived values
  const photoTotalCalories = editingComponents.reduce((sum, c) => sum + recalcComponentCalories(c), 0);
  const photoTotalProtein = editingComponents.reduce((sum, c) => sum + Math.round(c.protein * c.quantity * (sizeMultipliers[c.size] ?? 1) * 10) / 10, 0);
  const photoTotalCarbs = editingComponents.reduce((sum, c) => sum + Math.round(c.carbs * c.quantity * (sizeMultipliers[c.size] ?? 1) * 10) / 10, 0);
  const photoTotalFat = editingComponents.reduce((sum, c) => sum + Math.round(c.fat * c.quantity * (sizeMultipliers[c.size] ?? 1) * 10) / 10, 0);

  function changeMealType(type: MealType) {
    setMealType(type);
    setCuisine('all');
    setFoodCategory('all');
    setSelectedFood(null);
  }

  async function logMeal(event: FormEvent) {
    event.preventDefault();
    if (!currentFood) return;
    await supabase.from('meal_logs').insert({
      food_name: currentFood.name,
      category: mealType,
      quantity: bowlMultiplier,
      portion_grams: Math.round(bowlMultiplier * 200),
      calories: estimatedCalories,
      protein: estimatedProtein,
      carbs: estimatedCarbs,
      fat: estimatedFat,
      bowl_size: bowlSize,
    });
    await refresh();
  }

  function handlePhotoSelect(file: File) {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        setAnalysisError('This image could not be prepared. Please choose another photo.');
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.82));
      setAnalysis(null);
      setAnalysisError('');
      setEditingComponents([]);
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setAnalysisError('This image could not be read. Please choose another photo.');
    };
    image.src = objectUrl;
  }

  function retakePhoto() {
    setPhotoPreview(null);
    setAnalysis(null);
    setAnalysisError('');
    setEditingComponents([]);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function analyzePhoto() {
    if (!photoPreview) return;
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/food-photo-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ image: photoPreview }),
      });
      if (!response.ok) throw new Error(`Analysis failed (${response.status})`);
      const result = await response.json() as { error?: string } & PhotoAnalysis;
      if (result.error) throw new Error(result.error);
      if (!result.components || !Array.isArray(result.components)) throw new Error('Invalid analysis result');
      setAnalysis(result);
      setEditingComponents(result.components);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Could not analyze photo');
    } finally {
      setAnalyzing(false);
    }
  }

  function updateComponent(index: number, field: keyof PhotoComponent, value: string | number) {
    setEditingComponents((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  }

  async function confirmAndAdd() {
    for (const c of editingComponents) {
      const cal = recalcComponentCalories(c);
      const sizeMult = sizeMultipliers[c.size] ?? 1;
      const prot = Math.round(c.protein * c.quantity * sizeMult * 10) / 10;
      const carb = Math.round(c.carbs * c.quantity * sizeMult * 10) / 10;
      const ft = Math.round(c.fat * c.quantity * sizeMult * 10) / 10;
      await supabase.from('meal_logs').insert({
        food_name: c.foodName,
        category: photoMealType,
        quantity: c.quantity,
        portion_grams: Math.round(c.quantity * 200),
        calories: cal,
        protein: prot,
        carbs: carb,
        fat: ft,
        bowl_size: `${c.quantity} ${c.servingUnit}${c.size ? ` (${c.size})` : ''}`,
      });
    }
    await refresh();
    setShowPhotoUI(false);
    setPhotoPreview(null);
    setAnalysis(null);
    setEditingComponents([]);
    setAnalysisError('');
  }

  return <div className="reference-page-content meal-reference-page">
    <div className="reference-page-heading"><div><div className="reference-title-icon meal-icon"><Utensils size={24} /></div><h1>Meal Log</h1></div><span className="meal-count-badge">{meals.length} logged</span></div>

    {/* Food Photo Analysis Section */}
    <section className="reference-card photo-analysis-card">
      <div className="reference-card-heading"><h2><Camera size={19} /> Food Photo Analysis</h2><button className="reference-add-button" onClick={() => { setShowPhotoUI(!showPhotoUI); if (!showPhotoUI) { setPhotoPreview(null); setAnalysis(null); setAnalysisError(''); setEditingComponents([]); } }}>{showPhotoUI ? <><X size={16} /> Close</> : <><Camera size={16} /> Open</>}</button></div>
      {showPhotoUI && <div className="photo-analysis-body">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }} />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }} />
        {!photoPreview && <div className="photo-input-buttons">
          <button className="photo-action-btn" onClick={() => cameraInputRef.current?.click()}><Camera size={20} /><span>Take Photo</span></button>
          <button className="photo-action-btn" onClick={() => fileInputRef.current?.click()}><ImageIcon size={20} /><span>Upload / Import</span></button>
        </div>}
        {photoPreview && <div className="photo-preview-wrap">
          <img src={photoPreview} alt="Food preview" className="photo-preview-img" />
          <div className="photo-preview-actions">
            <button className="photo-action-btn small" onClick={retakePhoto}><X size={16} /> Retake</button>
            <button className="photo-action-btn small primary" onClick={analyzePhoto} disabled={analyzing}>{analyzing ? <Loader2 size={16} className="spin" /> : <Search size={16} />} {analyzing ? 'Analyzing...' : 'Analyze Food'}</button>
          </div>
        </div>}
        {analysisError && <div className="photo-error-box"><AlertCircle size={16} /> {analysisError}</div>}
        {analysis && editingComponents.length > 0 && <div className="photo-results">
          <div className="photo-confidence">
            {analysis.confidence === 'Low' && <span className="confidence-low"><AlertCircle size={14} /> Food identification is uncertain.</span>}
            {analysis.confidence !== 'Low' && <span className="confidence-ok"><Check size={14} /> Identification: {analysis.confidence}</span>}
            {analysis.notes && <p className="photo-notes">{analysis.notes}</p>}
          </div>
          <label>Meal Type<div className="meal-type-tabs">{mealTypes.map((type) => <button type="button" key={type} className={photoMealType === type ? 'active' : ''} onClick={() => setPhotoMealType(type)}>{type}</button>)}</div></label>
          {editingComponents.map((c, i) => <div className="photo-component" key={i}>
            <div className="photo-component-header"><b>Component {i + 1}</b><span>{recalcComponentCalories(c)} kcal (estimated)</span></div>
            <div className="photo-component-fields">
              <label>Food Name<input type="text" value={c.foodName} onChange={(e) => updateComponent(i, 'foodName', e.target.value)} /></label>
              <label>Quantity<input type="number" min="0.25" step="0.25" value={c.quantity} onChange={(e) => updateComponent(i, 'quantity', Number(e.target.value))} /></label>
              <label>Serving Unit<input type="text" value={c.servingUnit} onChange={(e) => updateComponent(i, 'servingUnit', e.target.value)} /></label>
              <label>Size<select value={c.size} onChange={(e) => updateComponent(i, 'size', e.target.value)}><option value="">N/A</option><option>Small</option><option>Medium</option><option>Large</option></select></label>
              <label>Cooking Method<input type="text" value={c.cookingMethod} onChange={(e) => updateComponent(i, 'cookingMethod', e.target.value)} /></label>
              <label>Oil Level<select value={c.oilLevel} onChange={(e) => updateComponent(i, 'oilLevel', e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label>Sugar Level<select value={c.sugarLevel} onChange={(e) => updateComponent(i, 'sugarLevel', e.target.value)}><option>None</option><option>Low</option><option>Medium</option><option>High</option></select></label>
            </div>
          </div>)}
          <div className="photo-total-summary">
            <div className="photo-total-calories"><b>{photoTotalCalories}</b><span>Total Estimated Calories</span></div>
            <div className="photo-total-macros">
              <div><b>{photoTotalProtein}g</b><span>Protein</span></div>
              <div><b>{photoTotalCarbs}g</b><span>Carbs</span></div>
              <div><b>{photoTotalFat}g</b><span>Fat</span></div>
            </div>
          </div>
          <div className="photo-confirm-actions">
            <button className="photo-action-btn" onClick={() => { setEditingComponents(analysis.components); }}><Pencil size={16} /> Reset Edits</button>
            <button className="photo-action-btn primary" onClick={confirmAndAdd}><Check size={16} /> Confirm &amp; Add</button>
          </div>
        </div>}
      </div>}
    </section>

    <section className="reference-card meal-entry-card">
      <form onSubmit={logMeal} className="reference-form meal-reference-form">
        <label>Meal Type<div className="meal-type-tabs">{mealTypes.map((type) => <button type="button" key={type} className={mealType === type ? 'active' : ''} onClick={() => changeMealType(type)}>{type}</button>)}</div></label>
        <label>Food Category<select value={foodCategory} onChange={(event) => { setFoodCategory(event.target.value); setSelectedFood(null); }}><option value="all">All Categories</option>{foodCategoryOptions.map((category) => <option key={category} value={category}>{foodCategoryIcons[category]} {category}</option>)}</select></label>
        <label>Search Food<div className="food-search-wrap"><Search size={16} className="food-search-icon" /><input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, cuisine, or category..." /></div></label>
        <label>Cuisine<select value={cuisine} onChange={(event) => { setCuisine(event.target.value); setSelectedFood(null); }}>{cuisinesForType.map((option) => <option key={option} value={option}>{option === 'all' ? 'All Cuisines' : option}</option>)}</select></label>
        <label>Dish<select value={currentFood?.name || ''} onChange={(event) => { const food = filteredFoods.find((item) => item.name === event.target.value); setSelectedFood(food || null); }}><option value="">Select dish</option>{filteredFoods.map((food) => <option key={food.name} value={food.name}>{foodEmoji(food)} {food.name} — {food.caloriesPerCup} kcal/serving</option>)}</select></label>
        <label>Bowl Size<div className="bowl-size-grid">{bowlSizes.map((bowl) => <button type="button" key={bowl.label} className={`bowl-size-button ${bowlSize === bowl.label ? 'active' : ''}`} onClick={() => setBowlSize(bowl.label)}>{bowl.label}</button>)}</div></label>
        {currentFood && <div className="meal-macro-preview">
          <div className="macro-preview-calories"><b>{estimatedCalories}</b><span>kcal</span></div>
          <div className="macro-preview-grid">
            <div><b>{estimatedProtein}g</b><span>Protein</span></div>
            <div><b>{estimatedCarbs}g</b><span>Carbs</span></div>
            <div><b>{estimatedFat}g</b><span>Fat</span></div>
          </div>
          <div className="macro-preview-serving"><span>Serving: {foodServingSize(currentFood)}</span></div>
        </div>}
        <button className="reference-log-button meal-log-button" type="submit" disabled={!currentFood}><Check size={16} /> Log Meal</button>
      </form>
    </section>
    <section className="reference-card reference-history-card meal-summary-card"><div className="reference-card-heading"><h2>Today's meal log</h2><span>{Math.round(totalCalories)} estimated kcal</span></div>{meals.slice(0, 10).map((meal) => <div className="reference-history-row" key={meal.id}><div><b>{meal.food_name}</b><small>{meal.category} · {meal.bowl_size || `${meal.quantity} portion`}</small></div><div className="reference-history-right"><strong>{Math.round(meal.calories)} kcal</strong><button className="reference-delete-btn" onClick={() => { if (confirm('Delete this meal?')) { void supabase.from('meal_logs').delete().eq('id', meal.id).then(() => refresh()); } }}><Trash2 size={14} /></button></div></div>)}{!meals.length && <div className="reference-empty">Select a meal type and dish to log your first meal.</div>}</section>
  </div>;
}
