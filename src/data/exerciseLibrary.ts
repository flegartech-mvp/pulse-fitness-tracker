import type { Exercise, ExerciseCategory } from '@/types'

/**
 * Built-in exercise library. IDs are stable strings — workouts reference them,
 * so never change an existing id. Custom exercises live in app data instead.
 */

type Seed = [
  id: string,
  name: string,
  category: ExerciseCategory,
  metric: Exercise['metric'],
  equipment: string,
  muscles: string[],
  met: number,
  description: string,
]

const SEEDS: Seed[] = [
  // ── Chest ────────────────────────────────────────────────────────────────
  ['bench-press', 'Barbell Bench Press', 'chest', 'weight-reps', 'Barbell', ['Pectorals', 'Triceps', 'Front delts'], 6, 'Lie on a flat bench, grip slightly wider than shoulders, lower the bar to mid-chest and press up without bouncing.'],
  ['incline-db-press', 'Incline Dumbbell Press', 'chest', 'weight-reps', 'Dumbbells', ['Upper pectorals', 'Front delts', 'Triceps'], 6, 'On a 30–45° incline bench, press the dumbbells up and slightly together, lowering with control to chest level.'],
  ['db-bench-press', 'Dumbbell Bench Press', 'chest', 'weight-reps', 'Dumbbells', ['Pectorals', 'Triceps'], 6, 'Flat-bench press with dumbbells for a longer range of motion and even side-to-side loading.'],
  ['push-up', 'Push-Up', 'chest', 'reps', 'Bodyweight', ['Pectorals', 'Triceps', 'Core'], 7, 'Hands under shoulders, body in a straight line; lower until your chest nearly touches the floor, then press up.'],
  ['cable-fly', 'Cable Fly', 'chest', 'weight-reps', 'Cable machine', ['Pectorals'], 4, 'With cables at chest height, bring the handles together in a wide arc, keeping a soft bend in the elbows.'],
  ['chest-dip', 'Chest Dip', 'chest', 'reps', 'Dip bars', ['Lower pectorals', 'Triceps'], 7, 'Lean slightly forward on dip bars and lower until your shoulders are just below your elbows, then press up.'],
  ['machine-chest-press', 'Machine Chest Press', 'chest', 'weight-reps', 'Machine', ['Pectorals', 'Triceps'], 5, 'Seated press with a fixed path — a good way to push close to failure safely.'],
  ['incline-bench-press', 'Incline Barbell Press', 'chest', 'weight-reps', 'Barbell', ['Upper pectorals', 'Front delts'], 6, 'Barbell press on an incline bench; touch just below the collarbone and press up and slightly back.'],

  // ── Back ─────────────────────────────────────────────────────────────────
  ['deadlift', 'Deadlift', 'back', 'weight-reps', 'Barbell', ['Erectors', 'Glutes', 'Hamstrings', 'Lats'], 6, 'Hinge at the hips with a flat back, grip the bar outside your knees and stand up by driving through the floor.'],
  ['pull-up', 'Pull-Up', 'back', 'reps', 'Pull-up bar', ['Lats', 'Biceps', 'Mid-back'], 8, 'Overhand grip slightly wider than shoulders; pull your chin over the bar without swinging.'],
  ['chin-up', 'Chin-Up', 'back', 'reps', 'Pull-up bar', ['Lats', 'Biceps'], 8, 'Underhand shoulder-width grip; pull until your chin clears the bar, emphasizing the biceps and lower lats.'],
  ['barbell-row', 'Bent-Over Barbell Row', 'back', 'weight-reps', 'Barbell', ['Lats', 'Mid-back', 'Rear delts'], 6, 'Hinge to roughly 45°, pull the bar to your lower ribs and lower under control without standing up between reps.'],
  ['seated-cable-row', 'Seated Cable Row', 'back', 'weight-reps', 'Cable machine', ['Mid-back', 'Lats', 'Biceps'], 5, 'Sit tall, pull the handle to your stomach while squeezing the shoulder blades together.'],
  ['lat-pulldown', 'Lat Pulldown', 'back', 'weight-reps', 'Cable machine', ['Lats', 'Biceps'], 5, 'Pull the bar to your upper chest with a tall posture; resist the weight on the way up.'],
  ['single-arm-db-row', 'Single-Arm Dumbbell Row', 'back', 'weight-reps', 'Dumbbell', ['Lats', 'Mid-back'], 5, 'One hand braced on a bench, row the dumbbell to your hip with a flat back and square shoulders.'],
  ['t-bar-row', 'T-Bar Row', 'back', 'weight-reps', 'T-bar', ['Mid-back', 'Lats'], 6, 'Chest up over the pad or straddling the bar, row the handles to your torso and squeeze at the top.'],
  ['face-pull', 'Face Pull', 'back', 'weight-reps', 'Cable machine', ['Rear delts', 'Traps', 'Rotator cuff'], 4, 'With a rope at face height, pull towards your eyes while spreading the rope — great for posture and shoulder health.'],
  ['back-extension', 'Back Extension', 'back', 'reps', 'Bodyweight', ['Erectors', 'Glutes'], 4, 'On a 45° bench, hinge down and raise your torso until your body forms a straight line. Add a plate to progress.'],

  // ── Legs ─────────────────────────────────────────────────────────────────
  ['back-squat', 'Back Squat', 'legs', 'weight-reps', 'Barbell', ['Quads', 'Glutes', 'Core'], 6, 'Bar on the upper back, sit down between your hips until thighs are at least parallel, then drive up.'],
  ['front-squat', 'Front Squat', 'legs', 'weight-reps', 'Barbell', ['Quads', 'Core', 'Upper back'], 6, 'Bar racked on the front delts with high elbows; squat upright to hit the quads hard.'],
  ['romanian-deadlift', 'Romanian Deadlift', 'legs', 'weight-reps', 'Barbell', ['Hamstrings', 'Glutes'], 5, 'From standing, push your hips back with soft knees until you feel a deep hamstring stretch, then stand tall.'],
  ['leg-press', 'Leg Press', 'legs', 'weight-reps', 'Machine', ['Quads', 'Glutes'], 5, 'Feet shoulder-width on the platform; lower until your knees reach ~90° and press without locking out hard.'],
  ['walking-lunge', 'Walking Lunge', 'legs', 'weight-reps', 'Dumbbells', ['Quads', 'Glutes'], 6, 'Step forward and lower the back knee toward the floor; alternate legs as you walk. Count reps per leg.'],
  ['bulgarian-split-squat', 'Bulgarian Split Squat', 'legs', 'weight-reps', 'Dumbbells', ['Quads', 'Glutes'], 6, 'Rear foot elevated on a bench, lower straight down on the front leg. Brutal and effective.'],
  ['leg-extension', 'Leg Extension', 'legs', 'weight-reps', 'Machine', ['Quads'], 4, 'Seated, extend your knees against the pad and control the descent — pure quad isolation.'],
  ['leg-curl', 'Leg Curl', 'legs', 'weight-reps', 'Machine', ['Hamstrings'], 4, 'Curl your heels toward your glutes and lower slowly; keep your hips pinned to the pad.'],
  ['calf-raise', 'Standing Calf Raise', 'legs', 'weight-reps', 'Machine', ['Calves'], 4, 'Rise as high as possible onto your toes, pause, and lower until you feel a stretch.'],
  ['hip-thrust', 'Hip Thrust', 'legs', 'weight-reps', 'Barbell', ['Glutes', 'Hamstrings'], 5, 'Upper back on a bench, bar over your hips; drive up until your body is a flat tabletop and squeeze.'],
  ['goblet-squat', 'Goblet Squat', 'legs', 'weight-reps', 'Dumbbell', ['Quads', 'Glutes', 'Core'], 5, 'Hold a dumbbell at your chest and squat between your knees — a great squat pattern teacher.'],

  // ── Shoulders ────────────────────────────────────────────────────────────
  ['overhead-press', 'Overhead Press', 'shoulders', 'weight-reps', 'Barbell', ['Delts', 'Triceps', 'Core'], 6, 'Standing, press the bar from your collarbone to lockout overhead without leaning back excessively.'],
  ['seated-db-press', 'Seated Dumbbell Press', 'shoulders', 'weight-reps', 'Dumbbells', ['Delts', 'Triceps'], 5, 'Seated with back support, press the dumbbells overhead until your arms are straight.'],
  ['lateral-raise', 'Lateral Raise', 'shoulders', 'weight-reps', 'Dumbbells', ['Side delts'], 4, 'Raise the dumbbells out to your sides to shoulder height with a slight forward lean and soft elbows.'],
  ['rear-delt-fly', 'Rear Delt Fly', 'shoulders', 'weight-reps', 'Dumbbells', ['Rear delts', 'Mid-back'], 4, 'Hinged forward, raise the dumbbells out wide with thumbs slightly down; light weight, strict form.'],
  ['arnold-press', 'Arnold Press', 'shoulders', 'weight-reps', 'Dumbbells', ['Delts', 'Triceps'], 5, 'Start palms facing you, rotate out as you press overhead — hits all three delt heads.'],
  ['cable-lateral-raise', 'Cable Lateral Raise', 'shoulders', 'weight-reps', 'Cable machine', ['Side delts'], 4, 'Constant cable tension through the whole arc; raise to shoulder height and lower slowly.'],
  ['upright-row', 'Upright Row', 'shoulders', 'weight-reps', 'Barbell', ['Side delts', 'Traps'], 5, 'Pull the bar up along your body to chest height with elbows leading; keep the grip wide to spare the wrists.'],
  ['barbell-shrug', 'Barbell Shrug', 'shoulders', 'weight-reps', 'Barbell', ['Traps'], 4, 'Hold the bar at arm’s length and shrug your shoulders straight up toward your ears; pause at the top.'],

  // ── Arms ─────────────────────────────────────────────────────────────────
  ['barbell-curl', 'Barbell Curl', 'arms', 'weight-reps', 'Barbell', ['Biceps'], 4, 'Curl the bar from full extension without swinging your torso; squeeze at the top.'],
  ['db-curl', 'Dumbbell Curl', 'arms', 'weight-reps', 'Dumbbells', ['Biceps'], 4, 'Alternating or together — supinate the wrist as you curl for a full biceps contraction.'],
  ['hammer-curl', 'Hammer Curl', 'arms', 'weight-reps', 'Dumbbells', ['Biceps', 'Forearms'], 4, 'Neutral grip curl that loads the brachialis and forearms; great for thicker-looking arms.'],
  ['preacher-curl', 'Preacher Curl', 'arms', 'weight-reps', 'EZ bar', ['Biceps'], 4, 'Arms braced on the preacher pad removes momentum — full stretch at the bottom, no bouncing.'],
  ['triceps-pushdown', 'Triceps Pushdown', 'arms', 'weight-reps', 'Cable machine', ['Triceps'], 4, 'Elbows pinned to your sides, extend the cable down until your arms are straight.'],
  ['skull-crusher', 'Skull Crusher', 'arms', 'weight-reps', 'EZ bar', ['Triceps'], 4, 'Lying down, lower the bar to your forehead by bending only the elbows, then extend.'],
  ['overhead-triceps-extension', 'Overhead Triceps Extension', 'arms', 'weight-reps', 'Dumbbell', ['Triceps'], 4, 'Both hands under one dumbbell overhead; lower behind your head and extend for a deep long-head stretch.'],
  ['close-grip-bench', 'Close-Grip Bench Press', 'arms', 'weight-reps', 'Barbell', ['Triceps', 'Pectorals'], 6, 'Bench press with hands at shoulder width and elbows tucked — the heaviest triceps builder.'],
  ['cable-curl', 'Cable Curl', 'arms', 'weight-reps', 'Cable machine', ['Biceps'], 4, 'Curl against constant cable tension; ideal for high-rep finishing sets.'],

  // ── Core ─────────────────────────────────────────────────────────────────
  ['plank', 'Plank', 'core', 'duration', 'Bodyweight', ['Core', 'Shoulders'], 4, 'Forearms down, body in a dead-straight line; brace your abs and glutes and breathe.'],
  ['crunch', 'Crunch', 'core', 'reps', 'Bodyweight', ['Abs'], 4, 'Curl your shoulder blades off the floor, exhale at the top, and lower slowly.'],
  ['hanging-leg-raise', 'Hanging Leg Raise', 'core', 'reps', 'Pull-up bar', ['Lower abs', 'Hip flexors'], 5, 'Hanging from a bar, raise your legs to horizontal (or knees to chest) without swinging.'],
  ['russian-twist', 'Russian Twist', 'core', 'reps', 'Plate', ['Obliques'], 4, 'Seated, lean back slightly and rotate the weight side to side. Count total touches.'],
  ['ab-wheel-rollout', 'Ab Wheel Rollout', 'core', 'reps', 'Ab wheel', ['Core'], 5, 'From your knees, roll forward as far as you can hold a flat back, then pull back with your abs.'],
  ['cable-crunch', 'Cable Crunch', 'core', 'weight-reps', 'Cable machine', ['Abs'], 4, 'Kneeling under a rope attachment, crunch your ribs toward your hips against the cable.'],
  ['side-plank', 'Side Plank', 'core', 'duration', 'Bodyweight', ['Obliques', 'Core'], 4, 'Stacked on one forearm, keep your hips tall and body straight. Log each side as a set.'],
  ['dead-bug', 'Dead Bug', 'core', 'reps', 'Bodyweight', ['Core'], 3.5, 'On your back, extend opposite arm and leg while keeping your lower back glued to the floor.'],
  ['sit-up', 'Sit-Up', 'core', 'reps', 'Bodyweight', ['Abs', 'Hip flexors'], 4.5, 'Full sit-up from the floor; anchor your feet only if you must.'],

  // ── Cardio ───────────────────────────────────────────────────────────────
  ['running', 'Running', 'cardio', 'distance-duration', 'None', ['Legs', 'Heart'], 9.8, 'Outdoor or treadmill running. Log distance and time — pace and records are computed for you.'],
  ['cycling', 'Cycling', 'cardio', 'distance-duration', 'Bike', ['Legs', 'Heart'], 7.5, 'Road, trail, or stationary cycling at a moderate-to-vigorous effort.'],
  ['rowing', 'Rowing Machine', 'cardio', 'distance-duration', 'Rower', ['Back', 'Legs', 'Heart'], 7, 'Drive with the legs, then swing and pull. Log meters as distance (e.g. 2 km) and total time.'],
  ['walking', 'Walking', 'cardio', 'distance-duration', 'None', ['Legs', 'Heart'], 3.8, 'Brisk walking — the most underrated recovery and fat-loss tool there is.'],
  ['incline-walk', 'Incline Treadmill Walk', 'cardio', 'duration', 'Treadmill', ['Legs', 'Heart'], 5.3, 'Walking at 10–15% incline keeps the heart rate up with minimal joint stress.'],
  ['stair-climber', 'Stair Climber', 'cardio', 'duration', 'Machine', ['Legs', 'Heart'], 9, 'Steady stepping without leaning on the rails. Short sessions go a long way.'],
  ['jump-rope', 'Jump Rope', 'cardio', 'duration', 'Rope', ['Calves', 'Heart'], 11, 'Light bounces with relaxed shoulders — accumulate time in short rounds.'],
  ['swimming', 'Swimming', 'cardio', 'distance-duration', 'Pool', ['Full body', 'Heart'], 7, 'Continuous laps in any stroke. Log distance and total time.'],
  ['elliptical', 'Elliptical', 'cardio', 'duration', 'Machine', ['Legs', 'Heart'], 5, 'Low-impact steady-state cardio; keep a pace where talking is possible but not easy.'],
  ['hiit-session', 'HIIT Session', 'cardio', 'duration', 'None', ['Full body', 'Heart'], 8, 'Alternating hard intervals and recovery — log the total session time.'],

  // ── Full body ────────────────────────────────────────────────────────────
  ['burpee', 'Burpee', 'fullbody', 'reps', 'Bodyweight', ['Full body', 'Heart'], 8, 'Squat, kick back to a push-up, return and jump. The honest conditioning rep.'],
  ['kettlebell-swing', 'Kettlebell Swing', 'fullbody', 'weight-reps', 'Kettlebell', ['Glutes', 'Hamstrings', 'Core'], 9.5, 'Hinge and snap the hips to float the bell to chest height — power comes from the hips, not the arms.'],
  ['thruster', 'Thruster', 'fullbody', 'weight-reps', 'Barbell', ['Quads', 'Delts', 'Core'], 8, 'Front squat straight into an overhead press in one motion. Breathtaking in every sense.'],
  ['clean-and-press', 'Clean and Press', 'fullbody', 'weight-reps', 'Barbell', ['Full body'], 8, 'Pull the bar explosively to your shoulders, then press overhead. Reset each rep.'],
  ['turkish-get-up', 'Turkish Get-Up', 'fullbody', 'weight-reps', 'Kettlebell', ['Core', 'Shoulders'], 6, 'Slow, controlled floor-to-standing sequence with the weight locked out overhead. Count reps per side.'],
  ['battle-ropes', 'Battle Ropes', 'fullbody', 'duration', 'Ropes', ['Arms', 'Core', 'Heart'], 8, 'Alternating or double waves — work in 20–40 second bursts and log total time.'],
  ['sled-push', 'Sled Push', 'fullbody', 'duration', 'Sled', ['Legs', 'Core', 'Heart'], 9, 'Drive the sled with a low body angle and short powerful steps. Log total work time.'],
  ['farmers-carry', 'Farmer’s Carry', 'fullbody', 'duration', 'Dumbbells', ['Grip', 'Traps', 'Core'], 6, 'Heavy weight in each hand, walk tall without leaning. Log time under load.'],
  ['wall-ball', 'Wall Ball', 'fullbody', 'weight-reps', 'Medicine ball', ['Quads', 'Delts'], 8, 'Squat and throw the ball to a target overhead, catch and repeat in rhythm.'],
]

export const EXERCISE_LIBRARY: Exercise[] = SEEDS.map(
  ([id, name, category, metric, equipment, muscles, met, description]) => ({
    id: `ex-${id}`,
    name,
    category,
    metric,
    equipment,
    muscles,
    met,
    description,
  }),
)

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  cardio: 'Cardio',
  fullbody: 'Full Body',
}
