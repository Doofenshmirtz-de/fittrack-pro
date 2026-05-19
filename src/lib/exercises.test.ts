import { describe, it, expect } from 'vitest';
import { EXERCISES, getExercisesByMuscleGroup, searchExercises } from './exercises';

describe('Exercises Library', () => {
  describe('getExercisesByMuscleGroup', () => {
    it('should group exercises by muscle group', () => {
      const grouped = getExercisesByMuscleGroup();

      expect(grouped).toHaveProperty('Brust');
      expect(grouped).toHaveProperty('Rücken');
      expect(grouped).toHaveProperty('Beine');
      expect(grouped).toHaveProperty('Schultern');
      expect(grouped).toHaveProperty('Arme');
      expect(grouped).toHaveProperty('Core');
    });

    it('should have at least one exercise in each group', () => {
      const grouped = getExercisesByMuscleGroup();

      Object.values(grouped).forEach((exercises) => {
        expect(exercises.length).toBeGreaterThan(0);
      });
    });

    it('should have valid exercise objects', () => {
      const grouped = getExercisesByMuscleGroup();

      Object.values(grouped).forEach((exercises) => {
        exercises.forEach((exercise) => {
          expect(exercise).toHaveProperty('id');
          expect(exercise).toHaveProperty('name');
          expect(exercise).toHaveProperty('muscle_group');
          expect(exercise.name).not.toBe('');
          expect(exercise.id).not.toBe('');
        });
      });
    });
  });

  describe('searchExercises', () => {
    it('should find exercises by name', () => {
      const results = searchExercises('Bankdrücken');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.name.toLowerCase().includes('bankdrücken'))).toBe(true);
    });

    it('should find exercises by muscle group', () => {
      const results = searchExercises('Brust');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((e) => e.muscle_group === 'Brust')).toBe(true);
    });

    it('should find exercises by equipment', () => {
      const results = searchExercises('Langhantel');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.equipment?.includes('Langhantel'))).toBe(true);
    });

    it('should be case insensitive', () => {
      const lowerCase = searchExercises('bankdrücken');
      const upperCase = searchExercises('BANKDRÜCKEN');
      expect(lowerCase.length).toBe(upperCase.length);
    });

    it('should return empty array for non-existent exercise', () => {
      const results = searchExercises('NonExistentExercise12345');
      expect(results).toEqual([]);
    });
  });

  describe('EXERCISES data', () => {
    it('should have unique IDs', () => {
      const ids = EXERCISES.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have at least 80 exercises', () => {
      expect(EXERCISES.length).toBeGreaterThanOrEqual(80);
    });

    it('should have all required fields', () => {
      EXERCISES.forEach((exercise) => {
        expect(exercise.id).toBeDefined();
        expect(exercise.name).toBeDefined();
        expect(exercise.muscle_group).toBeDefined();
        expect(typeof exercise.id).toBe('string');
        expect(typeof exercise.name).toBe('string');
        expect(typeof exercise.muscle_group).toBe('string');
      });
    });
  });
});
