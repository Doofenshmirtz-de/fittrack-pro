// Umfassende Übungsdatenbank für FitTrack Pro
export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
}

export const EXERCISES: Exercise[] = [
  // === BRUST ===
  { id: 'ex-1', name: 'Bankdrücken', muscle_group: 'Brust', equipment: 'Langhantel' },
  { id: 'ex-2', name: 'Schrägbankdrücken', muscle_group: 'Brust', equipment: 'Langhantel' },
  { id: 'ex-3', name: 'Negativ Bankdrücken', muscle_group: 'Brust', equipment: 'Langhantel' },
  { id: 'ex-4', name: 'Kurzhantel Bankdrücken', muscle_group: 'Brust', equipment: 'Kurzhanteln' },
  { id: 'ex-5', name: 'Kurzhantel Schrägbankdrücken', muscle_group: 'Brust', equipment: 'Kurzhanteln' },
  { id: 'ex-6', name: 'Fliegende', muscle_group: 'Brust', equipment: 'Kurzhanteln' },
  { id: 'ex-7', name: 'Schrägbank Fliegende', muscle_group: 'Brust', equipment: 'Kurzhanteln' },
  { id: 'ex-8', name: 'Kabelzug Flys', muscle_group: 'Brust', equipment: 'Kabelzug' },
  { id: 'ex-9', name: 'Kabelzug Crossover', muscle_group: 'Brust', equipment: 'Kabelzug' },
  { id: 'ex-10', name: 'Brustpresse', muscle_group: 'Brust', equipment: 'Maschine' },
  { id: 'ex-11', name: 'Butterfly', muscle_group: 'Brust', equipment: 'Maschine' },
  { id: 'ex-12', name: 'Dips (Brust)', muscle_group: 'Brust', equipment: 'Körpergewicht' },
  { id: 'ex-13', name: 'Liegestütze', muscle_group: 'Brust', equipment: 'Körpergewicht' },

  // === RÜCKEN ===
  { id: 'ex-20', name: 'Kreuzheben', muscle_group: 'Rücken', equipment: 'Langhantel' },
  { id: 'ex-21', name: 'Rumänisches Kreuzheben', muscle_group: 'Rücken', equipment: 'Langhantel' },
  { id: 'ex-22', name: 'Langhantel Rudern', muscle_group: 'Rücken', equipment: 'Langhantel' },
  { id: 'ex-23', name: 'T-Bar Rudern', muscle_group: 'Rücken', equipment: 'Langhantel' },
  { id: 'ex-24', name: 'Kurzhantel Rudern', muscle_group: 'Rücken', equipment: 'Kurzhanteln' },
  { id: 'ex-25', name: 'Einarmiges Kurzhantel Rudern', muscle_group: 'Rücken', equipment: 'Kurzhanteln' },
  { id: 'ex-26', name: 'Klimmzüge', muscle_group: 'Rücken', equipment: 'Körpergewicht' },
  { id: 'ex-27', name: 'Klimmzüge (breit)', muscle_group: 'Rücken', equipment: 'Körpergewicht' },
  { id: 'ex-28', name: 'Klimmzüge (eng)', muscle_group: 'Rücken', equipment: 'Körpergewicht' },
  { id: 'ex-29', name: 'Latziehen', muscle_group: 'Rücken', equipment: 'Kabelzug' },
  { id: 'ex-30', name: 'Latziehen (breit)', muscle_group: 'Rücken', equipment: 'Kabelzug' },
  { id: 'ex-31', name: 'Latziehen (eng)', muscle_group: 'Rücken', equipment: 'Kabelzug' },
  { id: 'ex-32', name: 'Kabelzug Rudern', muscle_group: 'Rücken', equipment: 'Kabelzug' },
  { id: 'ex-33', name: 'Kabelzug Rudern (eng)', muscle_group: 'Rücken', equipment: 'Kabelzug' },
  { id: 'ex-34', name: 'Rudermaschine', muscle_group: 'Rücken', equipment: 'Maschine' },
  { id: 'ex-35', name: 'Shrugs', muscle_group: 'Rücken', equipment: 'Kurzhanteln' },
  { id: 'ex-36', name: 'Reverse Butterfly', muscle_group: 'Rücken', equipment: 'Maschine' },

  // === BEINE ===
  { id: 'ex-50', name: 'Kniebeugen', muscle_group: 'Beine', equipment: 'Langhantel' },
  { id: 'ex-51', name: 'Front Squats', muscle_group: 'Beine', equipment: 'Langhantel' },
  { id: 'ex-52', name: 'Bulgarian Split Squats', muscle_group: 'Beine', equipment: 'Kurzhanteln' },
  { id: 'ex-53', name: 'Ausfallschritte', muscle_group: 'Beine', equipment: 'Kurzhanteln' },
  { id: 'ex-54', name: 'Beinpresse', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-55', name: 'Beinstrecker', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-56', name: 'Beinbeuger', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-57', name: 'Beinbeuger (liegend)', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-58', name: 'Beinbeuger (sitzend)', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-59', name: 'Wadenheben (stehend)', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-60', name: 'Wadenheben (sitzend)', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-61', name: 'Hackenschmidt', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-62', name: 'Adduktoren', muscle_group: 'Beine', equipment: 'Maschine' },
  { id: 'ex-63', name: 'Abduktoren', muscle_group: 'Beine', equipment: 'Maschine' },

  // === SCHULTERN ===
  { id: 'ex-80', name: 'Schulterdrücken Langhantel', muscle_group: 'Schultern', equipment: 'Langhantel' },
  { id: 'ex-81', name: 'Schulterdrücken Kurzhanteln', muscle_group: 'Schultern', equipment: 'Kurzhanteln' },
  { id: 'ex-82', name: 'Arnold Press', muscle_group: 'Schultern', equipment: 'Kurzhanteln' },
  { id: 'ex-83', name: 'Seitheben', muscle_group: 'Schultern', equipment: 'Kurzhanteln' },
  { id: 'ex-84', name: 'Seitheben Kabelzug', muscle_group: 'Schultern', equipment: 'Kabelzug' },
  { id: 'ex-85', name: 'Frontheben', muscle_group: 'Schultern', equipment: 'Kurzhanteln' },
  { id: 'ex-86', name: 'Frontheben Langhantel', muscle_group: 'Schultern', equipment: 'Langhantel' },
  { id: 'ex-87', name: 'Reverse Flys', muscle_group: 'Schultern', equipment: 'Kurzhanteln' },
  { id: 'ex-88', name: 'Face Pulls', muscle_group: 'Schultern', equipment: 'Kabelzug' },
  { id: 'ex-89', name: 'Schulterdrücken Maschine', muscle_group: 'Schultern', equipment: 'Maschine' },
  { id: 'ex-90', name: 'Upright Rows', muscle_group: 'Schultern', equipment: 'Langhantel' },

  // === ARME (BIZEPS) ===
  { id: 'ex-100', name: 'Bizeps Curls Langhantel', muscle_group: 'Arme', equipment: 'Langhantel' },
  { id: 'ex-101', name: 'Bizeps Curls Kurzhanteln', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-102', name: 'Hammercurls', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-103', name: 'Konzentrationscurls', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-104', name: 'Bizeps Curls Kabelzug', muscle_group: 'Arme', equipment: 'Kabelzug' },
  { id: 'ex-105', name: 'Preacher Curls', muscle_group: 'Arme', equipment: 'Langhantel' },
  { id: 'ex-106', name: 'Spider Curls', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-107', name: '21s Curls', muscle_group: 'Arme', equipment: 'Langhantel' },

  // === ARME (TRIZEPS) ===
  { id: 'ex-120', name: 'Trizeps Dips', muscle_group: 'Arme', equipment: 'Körpergewicht' },
  { id: 'ex-121', name: 'Trizeps Extension Kabelzug', muscle_group: 'Arme', equipment: 'Kabelzug' },
  { id: 'ex-122', name: 'Trizeps Extension Kurzhanteln', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-123', name: 'French Press', muscle_group: 'Arme', equipment: 'Langhantel' },
  { id: 'ex-124', name: 'Trizeps Kickbacks', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-125', name: 'Close Grip Bench Press', muscle_group: 'Arme', equipment: 'Langhantel' },
  { id: 'ex-126', name: 'Overhead Extension', muscle_group: 'Arme', equipment: 'Kurzhanteln' },
  { id: 'ex-127', name: 'Rope Pushdown', muscle_group: 'Arme', equipment: 'Kabelzug' },

  // === CORE/BAUCH ===
  { id: 'ex-150', name: 'Crunches', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-151', name: 'Planks', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-152', name: 'Side Planks', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-153', name: 'Russian Twists', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-154', name: 'Leg Raises', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-155', name: 'Hanging Leg Raises', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-156', name: 'Ab Wheel', muscle_group: 'Core', equipment: 'Gerät' },
  { id: 'ex-157', name: 'Cable Crunches', muscle_group: 'Core', equipment: 'Kabelzug' },
  { id: 'ex-158', name: 'Mountain Climbers', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-159', name: 'Bicycle Crunches', muscle_group: 'Core', equipment: 'Körpergewicht' },
  { id: 'ex-160', name: 'Dead Bug', muscle_group: 'Core', equipment: 'Körpergewicht' },

  // === CARDIO ===
  { id: 'ex-200', name: 'Laufband', muscle_group: 'Cardio', equipment: 'Maschine' },
  { id: 'ex-201', name: 'Crosstrainer', muscle_group: 'Cardio', equipment: 'Maschine' },
  { id: 'ex-202', name: 'Fahrrad', muscle_group: 'Cardio', equipment: 'Maschine' },
  { id: 'ex-203', name: 'Rudergerät', muscle_group: 'Cardio', equipment: 'Maschine' },
  { id: 'ex-204', name: 'Stairmaster', muscle_group: 'Cardio', equipment: 'Maschine' },
  { id: 'ex-205', name: 'Seilspringen', muscle_group: 'Cardio', equipment: 'Gerät' },
  { id: 'ex-206', name: 'Burpees', muscle_group: 'Cardio', equipment: 'Körpergewicht' },
];

// Helper-Funktion zum Gruppieren
export const getExercisesByMuscleGroup = () => {
  return EXERCISES.reduce((acc, exercise) => {
    if (!acc[exercise.muscle_group]) {
      acc[exercise.muscle_group] = [];
    }
    acc[exercise.muscle_group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);
};

// Helper-Funktion zum Suchen
export const searchExercises = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return EXERCISES.filter(
    ex =>
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.muscle_group.toLowerCase().includes(lowerQuery) ||
      (ex.equipment?.toLowerCase() || '').includes(lowerQuery)
  );
};

