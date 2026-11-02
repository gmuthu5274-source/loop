// Enriched workout metadata for exercises in the library.
// Maps exercise name -> detailed info for display and recommendations.

export type WorkoutMetadata = {
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  instructions: string;
  restSeconds: number;
  easierAlternative?: string;
  progression?: string;
  safetyTip?: string;
};

const metadata: Record<string, WorkoutMetadata> = {
  // Chest - Weighted
  'Barbell Bench Press': {
    name: 'Barbell Bench Press', difficulty: 'intermediate', equipment: 'Barbell, Bench, Rack',
    instructions: 'Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower to mid-chest, press up to full extension.',
    restSeconds: 90, easierAlternative: 'Dumbbell Bench Press', progression: 'Increase weight by 2.5kg when you can complete all reps with good form.',
    safetyTip: 'Use a spotter for heavy sets. Keep feet flat on the floor and shoulder blades retracted.',
  },
  'Dumbbell Bench Press': {
    name: 'Dumbbell Bench Press', difficulty: 'beginner', equipment: 'Dumbbells, Bench',
    instructions: 'Lie flat, hold dumbbells at chest level, press up until arms are extended, lower with control.',
    restSeconds: 60, easierAlternative: 'Machine Chest Press', progression: 'Move to barbell once comfortable with dumbbells.',
    safetyTip: 'Keep wrists neutral and lower dumbbells to chest level, not below.',
  },
  'Incline Barbell Press': {
    name: 'Incline Barbell Press', difficulty: 'intermediate', equipment: 'Barbell, Incline Bench, Rack',
    instructions: 'Set bench to 30-45 degrees. Grip bar wider than shoulders, lower to upper chest, press up.',
    restSeconds: 90, easierAlternative: 'Incline Dumbbell Press', progression: 'Increase weight gradually as upper chest strengthens.',
    safetyTip: 'Don\'t arch your back excessively. Keep glutes on the bench.',
  },
  'Incline Dumbbell Press': {
    name: 'Incline Dumbbell Press', difficulty: 'beginner', equipment: 'Dumbbells, Incline Bench',
    instructions: 'Set bench to 30-45 degrees. Press dumbbells from upper chest to full extension.',
    restSeconds: 60, easierAlternative: 'Incline Push Ups',
  },
  'Cable Chest Fly': {
    name: 'Cable Chest Fly', difficulty: 'beginner', equipment: 'Cable Machine',
    instructions: 'Set pulleys to chest height. Step forward, bring handles together in an arc motion in front of your chest.',
    restSeconds: 45, easierAlternative: 'Pec Deck Machine',
  },
  'Machine Chest Press': {
    name: 'Machine Chest Press', difficulty: 'beginner', equipment: 'Chest Press Machine',
    instructions: 'Sit with back flat, grip handles at chest height, press forward to full extension, return slowly.',
    restSeconds: 60, easierAlternative: 'Push Ups',
  },
  'Dumbbell Pullover': {
    name: 'Dumbbell Pullover', difficulty: 'intermediate', equipment: 'Dumbbell, Bench',
    instructions: 'Lie across a bench, hold one dumbbell with both hands over chest, lower behind head in an arc, pull back up.',
    restSeconds: 60, safetyTip: 'Keep a slight bend in elbows. Don\'t lower beyond a comfortable range.',
  },
  // Back
  'Barbell Row': {
    name: 'Barbell Row', difficulty: 'intermediate', equipment: 'Barbell',
    instructions: 'Hinge at hips, keep back flat, pull bar to lower ribcage, squeeze shoulder blades, lower with control.',
    restSeconds: 90, easierAlternative: 'Cable Row', progression: 'Add weight once you can maintain a flat back for all reps.',
    safetyTip: 'Never round your lower back. If form breaks, reduce weight.',
  },
  'Dumbbell Row': {
    name: 'Dumbbell Row', difficulty: 'beginner', equipment: 'Dumbbell, Bench',
    instructions: 'One hand on bench, pull dumbbell to hip, squeeze back, lower with control.',
    restSeconds: 60, easierAlternative: 'Cable Row',
  },
  'Lat Pulldown': {
    name: 'Lat Pulldown', difficulty: 'beginner', equipment: 'Lat Pulldown Machine',
    instructions: 'Grip bar wider than shoulders, pull to upper chest, squeeze lats, return slowly.',
    restSeconds: 60, easierAlternative: 'Assisted Pull Ups',
  },
  'Cable Row': {
    name: 'Cable Row', difficulty: 'beginner', equipment: 'Cable Machine',
    instructions: 'Sit with feet on pads, pull handle to abdomen, squeeze shoulder blades, return slowly.',
    restSeconds: 60, easierAlternative: 'Resistance Band Row',
  },
  // Shoulders
  'Barbell Overhead Press': {
    name: 'Barbell Overhead Press', difficulty: 'intermediate', equipment: 'Barbell, Rack',
    instructions: 'Stand, grip bar at shoulder width, press overhead to full extension, lower to shoulders.',
    restSeconds: 90, easierAlternative: 'Dumbbell Shoulder Press', progression: 'Increase weight by 1-2.5kg when all reps are clean.',
    safetyTip: 'Engage core, don\'t arch lower back. Press in a straight line overhead.',
  },
  'Dumbbell Shoulder Press': {
    name: 'Dumbbell Shoulder Press', difficulty: 'beginner', equipment: 'Dumbbells',
    instructions: 'Sit or stand, press dumbbells from shoulder height to overhead, lower with control.',
    restSeconds: 60, easierAlternative: 'Machine Shoulder Press',
  },
  'Dumbbell Lateral Raise': {
    name: 'Dumbbell Lateral Raise', difficulty: 'beginner', equipment: 'Dumbbells',
    instructions: 'Stand, raise dumbbells out to sides to shoulder height, lower slowly. Use light weight.',
    restSeconds: 45, easierAlternative: 'Cable Lateral Raise',
    safetyTip: 'Don\'t swing. If you have to use momentum, the weight is too heavy.',
  },
  'Face Pull': {
    name: 'Face Pull', difficulty: 'beginner', equipment: 'Cable Machine, Rope',
    instructions: 'Set pulley to face height, pull rope toward face, squeeze rear delts, return slowly.',
    restSeconds: 45, safetyTip: 'Use lighter weight. This is a corrective exercise, not a max-lift movement.',
  },
  // Arms
  'Barbell Bicep Curl': {
    name: 'Barbell Bicep Curl', difficulty: 'beginner', equipment: 'Barbell',
    instructions: 'Stand, grip bar at shoulder width, curl up by bending elbows, lower slowly.',
    restSeconds: 45, easierAlternative: 'Dumbbell Bicep Curl', safetyTip: 'Keep elbows pinned to your sides. Don\'t swing.',
  },
  'Hammer Curl': {
    name: 'Hammer Curl', difficulty: 'beginner', equipment: 'Dumbbells',
    instructions: 'Hold dumbbells with neutral grip (palms facing each other), curl up, lower slowly.',
    restSeconds: 45,
  },
  'Tricep Pushdown': {
    name: 'Tricep Pushdown', difficulty: 'beginner', equipment: 'Cable Machine',
    instructions: 'Grip bar at chest height, push down to full extension, return slowly. Keep elbows pinned.',
    restSeconds: 45, easierAlternative: 'Overhead Tricep Extension',
  },
  'Skull Crusher': {
    name: 'Skull Crusher', difficulty: 'intermediate', equipment: 'EZ Bar or Dumbbells, Bench',
    instructions: 'Lie on bench, lower bar toward forehead by bending elbows, extend back up.',
    restSeconds: 60, safetyTip: 'Use a controlled tempo. Don\'t let the weight drop toward your face.',
  },
  // Legs
  'Barbell Squat': {
    name: 'Barbell Squat', difficulty: 'intermediate', equipment: 'Barbell, Rack',
    instructions: 'Bar on upper back, feet shoulder-width, squat down to parallel, drive up through heels.',
    restSeconds: 120, easierAlternative: 'Goblet Squat', progression: 'Increase weight by 2.5-5kg when all reps hit depth.',
    safetyTip: 'Keep knees tracking over toes. Don\'t let knees cave inward. Brace your core before descending.',
  },
  'Goblet Squat': {
    name: 'Goblet Squat', difficulty: 'beginner', equipment: 'Dumbbell or Kettlebell',
    instructions: 'Hold weight at chest, squat down keeping chest up, drive through heels to stand.',
    restSeconds: 60, easierAlternative: 'Bodyweight Squat',
  },
  'Leg Press': {
    name: 'Leg Press', difficulty: 'beginner', equipment: 'Leg Press Machine',
    instructions: 'Place feet shoulder-width on platform, lower to 90 degrees, push back up.',
    restSeconds: 90, safetyTip: 'Don\'t lock knees at top. Don\'t lower past comfortable depth.',
  },
  'Romanian Deadlift': {
    name: 'Romanian Deadlift', difficulty: 'intermediate', equipment: 'Barbell or Dumbbells',
    instructions: 'Hinge at hips with slight knee bend, lower weight along legs, feel hamstring stretch, drive hips forward.',
    restSeconds: 90, easierAlternative: 'Good Morning', safetyTip: 'Keep back flat. Stop if you feel it in your lower back instead of hamstrings.',
  },
  'Leg Curl': {
    name: 'Leg Curl', difficulty: 'beginner', equipment: 'Leg Curl Machine',
    instructions: 'Lie or sit, curl pad toward glutes by bending knees, return slowly.',
    restSeconds: 45,
  },
  'Leg Extension': {
    name: 'Leg Extension', difficulty: 'beginner', equipment: 'Leg Extension Machine',
    instructions: 'Sit, extend knees to lift pad, squeeze quads, lower slowly.',
    restSeconds: 45, safetyTip: 'Don\'t lock knees hard at top. Use controlled movement.',
  },
  'Calf Raise': {
    name: 'Calf Raise', difficulty: 'beginner', equipment: 'None or Dumbbells',
    instructions: 'Stand on edge of step, rise onto toes, lower below step level for full stretch.',
    restSeconds: 30,
  },
  'Barbell Hip Thrust': {
    name: 'Barbell Hip Thrust', difficulty: 'intermediate', equipment: 'Barbell, Bench',
    instructions: 'Upper back on bench, bar across hips, drive hips up squeezing glutes, lower with control.',
    restSeconds: 90, easierAlternative: 'Glute Bridge',
  },
  // Bodyweight
  'Push Ups': {
    name: 'Push Ups', difficulty: 'beginner', equipment: 'None',
    instructions: 'Hands shoulder-width, lower chest toward floor keeping body straight, push back up.',
    restSeconds: 45, easierAlternative: 'Incline Push Ups (hands on elevated surface)', progression: 'Move to Diamond Push Ups once you can do 15+ clean reps.',
  },
  'Diamond Push Ups': {
    name: 'Diamond Push Ups', difficulty: 'intermediate', equipment: 'None',
    instructions: 'Form a diamond with hands under chest, lower, push up. Targets triceps.',
    restSeconds: 45, easierAlternative: 'Close Grip Push Ups',
  },
  'Pull Ups': {
    name: 'Pull Ups', difficulty: 'advanced', equipment: 'Pull Up Bar',
    instructions: 'Hang with overhand grip, pull chin above bar, lower with control.',
    restSeconds: 90, easierAlternative: 'Negative Pull Ups or Lat Pulldown', progression: 'Add weight once you can do 10+ clean reps.',
    safetyTip: 'Warm up shoulders first. Don\'t kip if you\'re building strength.',
  },
  'Chin Ups': {
    name: 'Chin Ups', difficulty: 'intermediate', equipment: 'Pull Up Bar',
    instructions: 'Underhand grip, pull chin above bar, lower with control.',
    restSeconds: 90, easierAlternative: 'Assisted Chin Ups',
  },
  'Bodyweight Squat': {
    name: 'Bodyweight Squat', difficulty: 'beginner', equipment: 'None',
    instructions: 'Feet shoulder-width, squat down keeping chest up, drive through heels.',
    restSeconds: 30, progression: 'Move to Jump Squats or Goblet Squats for more challenge.',
  },
  'Lunges': {
    name: 'Lunges', difficulty: 'beginner', equipment: 'None',
    instructions: 'Step forward, lower until both knees are ~90 degrees, push back to standing.',
    restSeconds: 45, easierAlternative: 'Stationary Split Squat',
  },
  'Glute Bridge': {
    name: 'Glute Bridge', difficulty: 'beginner', equipment: 'None',
    instructions: 'Lie on back, knees bent, drive hips up squeezing glutes, lower slowly.',
    restSeconds: 30, progression: 'Single Leg Glute Bridge or Barbell Hip Thrust.',
  },
  // Core
  'Plank': {
    name: 'Plank', difficulty: 'beginner', equipment: 'None',
    instructions: 'Forearms on ground, body straight from head to heels, hold position.',
    restSeconds: 30, progression: 'Increase hold time. Try Side Plank or Plank Jacks for variety.',
  },
  'Sit Ups': {
    name: 'Sit Ups', difficulty: 'beginner', equipment: 'None',
    instructions: 'Lie on back, knees bent, curl torso up toward knees, lower with control.',
    restSeconds: 30, easierAlternative: 'Crunches',
  },
  'Russian Twists': {
    name: 'Russian Twists', difficulty: 'beginner', equipment: 'None (optional dumbbell)',
    instructions: 'Sit with knees bent, lean back slightly, rotate torso side to side tapping the ground.',
    restSeconds: 30,
  },
  'Leg Raises': {
    name: 'Leg Raises', difficulty: 'beginner', equipment: 'None',
    instructions: 'Lie flat, lift straight legs to 90 degrees, lower slowly without touching floor.',
    restSeconds: 45, easierAlternative: 'Bent Knee Leg Raises',
  },
  'Mountain Climbers': {
    name: 'Mountain Climbers', difficulty: 'beginner', equipment: 'None',
    instructions: 'Start in plank position, drive knees toward chest alternately at a steady pace.',
    restSeconds: 30,
  },
  // Cardio
  'Burpees': {
    name: 'Burpees', difficulty: 'intermediate', equipment: 'None',
    instructions: 'From standing, drop to plank, do a push up, jump feet in, jump up with arms overhead.',
    restSeconds: 45, easierAlternative: 'Half Burpees (skip push up)',
  },
  'Jumping Jacks': {
    name: 'Jumping Jacks', difficulty: 'beginner', equipment: 'None',
    instructions: 'Jump while spreading legs and raising arms overhead, return and repeat.',
    restSeconds: 30,
  },
  'Jump Rope': {
    name: 'Jump Rope', difficulty: 'beginner', equipment: 'Jump Rope',
    instructions: 'Jump on balls of feet, rotate rope with wrists, maintain steady rhythm.',
    restSeconds: 30, safetyTip: 'Land softly. Keep jumps low to reduce impact.',
  },
  'High Knees': {
    name: 'High Knees', difficulty: 'beginner', equipment: 'None',
    instructions: 'Run in place, bringing knees up to hip height, pump arms.',
    restSeconds: 30,
  },
  // Full Body
  'Barbell Deadlift': {
    name: 'Barbell Deadlift', difficulty: 'advanced', equipment: 'Barbell',
    instructions: 'Stand with bar over mid-foot, hinge and grip bar, keep back flat, stand up by driving hips and knees.',
    restSeconds: 180, easierAlternative: 'Trap Bar Deadlift or Romanian Deadlift', progression: 'Add 2.5-5kg once form is consistent. Focus on technique over weight.',
    safetyTip: 'Keep bar close to body. Never round your back. If form breaks, stop the set.',
  },
  'Kettlebell Swing': {
    name: 'Kettlebell Swing', difficulty: 'intermediate', equipment: 'Kettlebell',
    instructions: 'Hinge at hips, swing kettlebell back between legs, drive hips forward to swing it to chest height.',
    restSeconds: 60, safetyTip: 'Power comes from hips, not arms. Don\'t squat - hinge.',
  },
  // Yoga
  'Downward Dog': {
    name: 'Downward Dog', difficulty: 'beginner', equipment: 'None',
    instructions: 'From all fours, lift hips up and back, forming an inverted V. Press through palms, heels toward floor.',
    restSeconds: 0, safetyTip: 'Don\'t force heels down if hamstrings are tight. Keep a slight knee bend.',
  },
  'Cobra Stretch': {
    name: 'Cobra Stretch', difficulty: 'beginner', equipment: 'None',
    instructions: 'Lie face down, hands under shoulders, gently lift chest by straightening arms. Keep hips on floor.',
    restSeconds: 0,
  },
  'Wall Sit': {
    name: 'Wall Sit', difficulty: 'beginner', equipment: 'None',
    instructions: 'Back against wall, slide down to 90-degree knee bend, hold position.',
    restSeconds: 0, progression: 'Increase hold time. Add weight on lap for more challenge.',
  },
};

export function getWorkoutMetadata(exerciseName: string): WorkoutMetadata | null {
  return metadata[exerciseName] || null;
}

export function recommendWorkouts(profile: { primary_goal: string; workout_experience: string; workout_location: string; preferred_duration: number | null }): string[] {
  const goal = profile.primary_goal || 'general_fitness';
  const exp = profile.workout_experience || 'beginner';
  const location = profile.workout_location || 'both';
  const isHome = location === 'home';
  const isBeginner = exp === 'beginner';

  if (goal === 'fat_loss' || goal === 'six_pack_core') {
    if (isHome) return ['Jumping Jacks', 'Bodyweight Squat', 'Push Ups', 'Mountain Climbers', 'Plank', 'Burpees'];
    return ['Barbell Squat', 'Push Ups', 'Lat Pulldown', 'Mountain Climbers', 'Plank', 'Burpees'];
  }

  if (goal === 'muscle_building' || goal === 'bodybuilding' || goal === 'strength') {
    if (isHome) return ['Push Ups', 'Pull Ups', 'Lunges', 'Glute Bridge', 'Plank', 'Diamond Push Ups'];
    return ['Barbell Bench Press', 'Barbell Squat', 'Barbell Row', 'Barbell Overhead Press', 'Lat Pulldown', 'Barbell Deadlift'];
  }

  if (goal === 'endurance' || goal === 'athletic') {
    return ['Jump Rope', 'Burpees', 'High Knees', 'Mountain Climbers', 'Lunges', 'Plank'];
  }

  // General fitness
  if (isBeginner) return ['Bodyweight Squat', 'Push Ups', 'Glute Bridge', 'Plank', 'Lunges', 'Cobra Stretch'];
  return ['Barbell Squat', 'Dumbbell Bench Press', 'Barbell Row', 'Dumbbell Shoulder Press', 'Plank', 'Lunges'];
}

export function getSafeWeightGuidance(experience: string): string {
  if (experience === 'beginner') {
    return 'As a beginner, start with light weights (or just the bar) to master form. Add 2.5kg only when you can complete all sets with perfect technique.';
  }
  if (experience === 'intermediate') {
    return 'As an intermediate, use 70-75% of your 1-rep max for working sets. Add weight in small increments when you can complete all reps cleanly.';
  }
  return 'As an advanced lifter, you know your body. Use progressive overload, deload every 4-6 weeks, and prioritize recovery and form.';
}
