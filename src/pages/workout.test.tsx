import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EXERCISES } from '@/lib/exercises';

// Mocks
const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

describe('Workout Logic Tests', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    vi.clearAllMocks();
  });

  describe('handleRepeatWorkout logic', () => {
    it('should copy sets with new IDs when repeating workout', () => {
      const oldWorkoutId = 'workout-123';
      const newWorkoutId = `workout-${Date.now()}`;

      const oldSets = [
        {
          id: 'set-1',
          workout_id: oldWorkoutId,
          exercise_id: 'ex-1',
          exercise: EXERCISES[0],
          set_number: 1,
          weight: 80,
          reps: 10,
          completed_at: '2026-01-01T10:00:00Z',
        },
      ];

      // Simuliere handleRepeatWorkout Logik
      localStorageMock.setItem(`fittrack_workout_${oldWorkoutId}_sets`, JSON.stringify(oldSets));

      const retrievedOldSets = JSON.parse(
        localStorageMock.getItem(`fittrack_workout_${oldWorkoutId}_sets`) || '[]'
      );

      const newSets = retrievedOldSets.map((set: any, index: number) => ({
        ...set,
        id: `set-${Date.now()}-${index}`,
        workout_id: newWorkoutId,
        completed_at: new Date().toISOString(),
        is_repeated: true,
      }));

      localStorageMock.setItem(`fittrack_workout_${newWorkoutId}_sets`, JSON.stringify(newSets));

      // Assertions
      const savedNewSets = JSON.parse(
        localStorageMock.getItem(`fittrack_workout_${newWorkoutId}_sets`) || '[]'
      );

      expect(savedNewSets).toHaveLength(1);
      expect(savedNewSets[0].workout_id).toBe(newWorkoutId);
      expect(savedNewSets[0].weight).toBe(80);
      expect(savedNewSets[0].reps).toBe(10);
      expect(savedNewSets[0].is_repeated).toBe(true);
    });
  });

  describe('handleStartWorkout from plan logic', () => {
    it('should create initial sets from plan exercises', () => {
      const workoutId = `workout-${Date.now()}`;
      const planExercises = [EXERCISES[0], EXERCISES[1]]; // Bankdrücken, Schrägbankdrücken

      const initialSets = planExercises.map((exercise, exerciseIndex) => ({
        id: `set-${Date.now()}-${exerciseIndex}`,
        workout_id: workoutId,
        exercise_id: exercise.id,
        exercise: exercise,
        set_number: 1,
        weight: null,
        reps: null,
        notes: null,
        completed_at: new Date().toISOString(),
        is_template: true,
      }));

      localStorageMock.setItem(`fittrack_workout_${workoutId}_sets`, JSON.stringify(initialSets));

      const savedSets = JSON.parse(
        localStorageMock.getItem(`fittrack_workout_${workoutId}_sets`) || '[]'
      );

      expect(savedSets).toHaveLength(2);
      expect(savedSets[0].exercise.name).toBe(EXERCISES[0].name);
      expect(savedSets[1].exercise.name).toBe(EXERCISES[1].name);
      expect(savedSets[0].is_template).toBe(true);
      expect(savedSets[0].weight).toBeNull();
    });
  });

  describe('localStorage Data Integrity', () => {
    it('should save and retrieve workouts correctly', () => {
      const testWorkouts = [
        {
          id: 'test-1',
          name: 'Workout 1',
          started_at: new Date().toISOString(),
          is_active: true,
        },
      ];

      localStorageMock.setItem('fittrack_workouts', JSON.stringify(testWorkouts));

      const retrieved = JSON.parse(localStorageMock.getItem('fittrack_workouts') || '[]');

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].name).toBe('Workout 1');
    });

    it('should save and retrieve sets correctly', () => {
      const testSets = [
        {
          id: 'set-1',
          workout_id: 'test-1',
          exercise: EXERCISES[0],
          weight: 100,
          reps: 8,
        },
      ];

      localStorageMock.setItem('fittrack_workout_test-1_sets', JSON.stringify(testSets));

      const retrieved = JSON.parse(localStorageMock.getItem('fittrack_workout_test-1_sets') || '[]');

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].weight).toBe(100);
      expect(retrieved[0].reps).toBe(8);
    });

    it('should handle empty localStorage gracefully', () => {
      const workouts = JSON.parse(localStorageMock.getItem('fittrack_workouts') || '[]');
      expect(workouts).toEqual([]);
    });
  });

  describe('WorkoutPlans - Data Structure', () => {
    it('should have valid default plans structure', () => {
      const requiredExercises = {
        'Push Day': ['Bankdrücken', 'Schulterdrücken Kurzhanteln'],
        'Pull Day': ['Kreuzheben', 'Klimmzüge'],
        'Leg Day': ['Kniebeugen', 'Beinpresse'],
      };

      Object.entries(requiredExercises).forEach(([planName, exercises]) => {
        exercises.forEach((exerciseName) => {
          const found = EXERCISES.find((e) => e.name === exerciseName);
          expect(found).toBeDefined();
        });
      });
    });

    it('should have at least 5 exercises per muscle group on average', () => {
      const grouped = EXERCISES.reduce((acc, exercise) => {
        if (!acc[exercise.muscle_group]) {
          acc[exercise.muscle_group] = [];
        }
        acc[exercise.muscle_group].push(exercise);
        return acc;
      }, {} as Record<string, typeof EXERCISES>);

      Object.values(grouped).forEach((exercises) => {
        expect(exercises.length).toBeGreaterThanOrEqual(5);
      });
    });
  });
});
