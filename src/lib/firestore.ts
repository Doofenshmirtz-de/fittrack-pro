import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Exercise } from './exercises';

// Types
export interface Workout {
  id?: string;
  userId: string;
  name: string;
  startedAt: Date;
  completedAt?: Date | null;
  isActive: boolean;
  bodyWeight?: number | null;
  notes?: string | null;
}

export interface Set {
  id?: string;
  workoutId: string;
  userId: string;
  exerciseId: string;
  exercise: Exercise;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  notes?: string | null;
  completedAt: Date;
  isTemplate?: boolean;
  isRepeated?: boolean;
}

export interface WorkoutPlan {
  id?: string;
  userId: string;
  name: string;
  description: string;
  exercises: Exercise[];
  createdAt: Date;
}

// Helper to convert Firestore timestamps to Date
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  if (data.startedAt instanceof Timestamp) {
    converted.startedAt = data.startedAt.toDate();
  }
  if (data.completedAt instanceof Timestamp) {
    converted.completedAt = data.completedAt.toDate();
  }
  if (data.createdAt instanceof Timestamp) {
    converted.createdAt = data.createdAt.toDate();
  }
  if (data.completedAt === null) {
    converted.completedAt = null;
  }
  
  return converted;
};

// Workout Operations
export const workoutService = {
  // Get all workouts for a user
  async getWorkouts(userId: string): Promise<Workout[]> {
    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', userId),
      orderBy('startedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Workout));
  },

  // Get a single workout
  async getWorkout(workoutId: string): Promise<Workout | null> {
    const docRef = doc(db, 'workouts', workoutId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...convertTimestamps(snapshot.data()),
    } as Workout;
  },

  // Create a new workout
  async createWorkout(workout: Omit<Workout, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'workouts'), {
      ...workout,
      startedAt: workout.startedAt instanceof Date ? Timestamp.fromDate(workout.startedAt) : serverTimestamp(),
      completedAt: workout.completedAt ? Timestamp.fromDate(workout.completedAt) : null,
    });
    return docRef.id;
  },

  // Update a workout
  async updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<void> {
    const docRef = doc(db, 'workouts', workoutId);
    const updateData: any = { ...updates };
    
    if (updates.startedAt) {
      updateData.startedAt = Timestamp.fromDate(updates.startedAt);
    }
    if (updates.completedAt) {
      updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }
    
    await updateDoc(docRef, updateData);
  },

  // Delete a workout and all its sets
  async deleteWorkout(workoutId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete the workout
    batch.delete(doc(db, 'workouts', workoutId));
    
    // Delete all associated sets
    const setsQuery = query(collection(db, 'sets'), where('workoutId', '==', workoutId));
    const setsSnapshot = await getDocs(setsQuery);
    setsSnapshot.docs.forEach((setDoc) => {
      batch.delete(doc(db, 'sets', setDoc.id));
    });
    
    await batch.commit();
  },
};

// Set Operations
export const setService = {
  // Get all sets for a workout
  async getSets(workoutId: string): Promise<Set[]> {
    const q = query(
      collection(db, 'sets'),
      where('workoutId', '==', workoutId),
      orderBy('completedAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date(),
    } as Set));
  },

  // Create a set
  async createSet(set: Omit<Set, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'sets'), {
      ...set,
      completedAt: Timestamp.fromDate(set.completedAt),
    });
    return docRef.id;
  },

  // Create multiple sets (batch)
  async createSets(sets: Omit<Set, 'id'>[]): Promise<string[]> {
    const batch = writeBatch(db);
    const ids: string[] = [];
    
    sets.forEach((set) => {
      const docRef = doc(collection(db, 'sets'));
      batch.set(docRef, {
        ...set,
        completedAt: Timestamp.fromDate(set.completedAt),
      });
      ids.push(docRef.id);
    });
    
    await batch.commit();
    return ids;
  },

  // Delete a set
  async deleteSet(setId: string): Promise<void> {
    await deleteDoc(doc(db, 'sets', setId));
  },
};

// Workout Plan Operations
export const planService = {
  // Get all plans for a user
  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    const q = query(
      collection(db, 'plans'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as WorkoutPlan));
  },

  // Create a plan
  async createPlan(plan: Omit<WorkoutPlan, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'plans'), {
      ...plan,
      createdAt: Timestamp.fromDate(plan.createdAt),
    });
    return docRef.id;
  },

  // Update a plan
  async updatePlan(planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const docRef = doc(db, 'plans', planId);
    const updateData: any = { ...updates };
    
    if (updates.createdAt) {
      updateData.createdAt = Timestamp.fromDate(updates.createdAt);
    }
    
    await updateDoc(docRef, updateData);
  },

  // Delete a plan
  async deletePlan(planId: string): Promise<void> {
    await deleteDoc(doc(db, 'plans', planId));
  },
};

// Migration helper: Transfer localStorage data to Firestore
export const migrateLocalStorageToFirestore = async (userId: string) => {
  try {
    // Migrate workouts
    const localWorkouts = JSON.parse(localStorage.getItem('fittrack_workouts') || '[]');
    for (const workout of localWorkouts) {
      const newWorkout = {
        userId,
        name: workout.name,
        startedAt: new Date(workout.started_at),
        completedAt: workout.completed_at ? new Date(workout.completed_at) : null,
        isActive: workout.is_active,
        bodyWeight: workout.body_weight || null,
        notes: workout.notes || null,
      };
      
      const workoutId = await workoutService.createWorkout(newWorkout);
      
      // Migrate sets for this workout
      const localSets = JSON.parse(localStorage.getItem(`fittrack_workout_${workout.id}_sets`) || '[]');
      const setsToCreate: Omit<Set, 'id'>[] = localSets.map((set: any) => ({
        workoutId,
        userId,
        exerciseId: set.exercise_id,
        exercise: set.exercise,
        setNumber: set.set_number,
        weight: set.weight,
        reps: set.reps,
        notes: set.notes,
        completedAt: new Date(set.completed_at),
      }));
      
      if (setsToCreate.length > 0) {
        await setService.createSets(setsToCreate);
      }
    }
    
    // Migrate plans
    const localPlans = JSON.parse(localStorage.getItem('fittrack_plans') || '[]');
    for (const plan of localPlans) {
      if (!plan.id.startsWith('default-')) {
        await planService.createPlan({
          userId,
          name: plan.name,
          description: plan.description,
          exercises: plan.exercises,
          createdAt: new Date(plan.created_at),
        });
      }
    }
    
    // Clear localStorage after successful migration
    localStorage.removeItem('fittrack_workouts');
    localStorage.removeItem('fittrack_plans');
    // Remove all workout-specific keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('fittrack_workout_')) {
        localStorage.removeItem(key);
      }
    }
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
