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
  FirestoreError,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Exercise } from './exercises';

// Custom Error Types
export class FirestorePermissionError extends Error {
  constructor(message: string = 'Keine Berechtigung für diese Aktion') {
    super(message);
    this.name = 'FirestorePermissionError';
  }
}

export class FirestoreNotFoundError extends Error {
  constructor(message: string = 'Dokument nicht gefunden') {
    super(message);
    this.name = 'FirestoreNotFoundError';
  }
}

export class FirestoreNetworkError extends Error {
  constructor(message: string = 'Netzwerkfehler - bitte Internetverbindung prüfen') {
    super(message);
    this.name = 'FirestoreNetworkError';
  }
}

export class FirestoreIndexError extends Error {
  constructor(message: string = 'Datenbank-Index wird noch erstellt - bitte warte einen Moment') {
    super(message);
    this.name = 'FirestoreIndexError';
  }
}

// Helper to parse Firestore errors
const parseFirestoreError = (error: FirestoreError | any): Error => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Permission denied
  if (errorCode === 'permission-denied' || errorMessage.includes('Missing or insufficient permissions')) {
    return new FirestorePermissionError(
      'Zugriff verweigert: Die Firestore Security Rules erlauben diese Aktion nicht. ' +
      'Bitte prüfe in der Firebase Console, ob die Rules korrekt veröffentlicht sind. ' +
      'Fehler: ' + errorMessage
    );
  }

  // Network error
  if (errorCode === 'unavailable' || errorMessage.includes('network')) {
    return new FirestoreNetworkError(
      'Keine Verbindung zu Firebase. Bitte prüfe deine Internetverbindung und versuche es erneut.'
    );
  }

  // Index error
  if (errorCode === 'failed-precondition' && errorMessage.includes('requires an index')) {
    return new FirestoreIndexError(
      'Die Datenbank benötigt einen Index für diese Abfrage. ' +
      'Bitte erstelle den Index in der Firebase Console unter Firestore Database > Indexes. ' +
      'Link: ' + errorMessage.match(/https:\/\/[^\s]+/)?.[0]
    );
  }

  // Not found
  if (errorCode === 'not-found') {
    return new FirestoreNotFoundError('Das angeforderte Dokument wurde nicht gefunden.');
  }

  // Default
  return new Error(`Firestore Fehler (${errorCode}): ${errorMessage}`);
};

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
    try {
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
    } catch (error: any) {
      console.error('Error getting workouts:', error);
      throw parseFirestoreError(error);
    }
  },

  // Get a single workout
  async getWorkout(workoutId: string): Promise<Workout | null> {
    try {
      const docRef = doc(db, 'workouts', workoutId);
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...convertTimestamps(snapshot.data()),
      } as Workout;
    } catch (error: any) {
      console.error('Error getting workout:', error);
      throw parseFirestoreError(error);
    }
  },

  // Create a new workout
  async createWorkout(workout: Omit<Workout, 'id'>): Promise<string> {
    try {
      // Validate required fields
      if (!workout.userId) {
        throw new Error('User ID ist erforderlich');
      }
      if (!workout.name || workout.name.trim() === '') {
        throw new Error('Workout Name ist erforderlich');
      }
      if (!workout.startedAt) {
        throw new Error('Startzeit ist erforderlich');
      }

      const docRef = await addDoc(collection(db, 'workouts'), {
        ...workout,
        startedAt: workout.startedAt instanceof Date ? Timestamp.fromDate(workout.startedAt) : serverTimestamp(),
        completedAt: workout.completedAt ? Timestamp.fromDate(workout.completedAt) : null,
      });
      
      console.log('Workout created successfully:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating workout:', error);
      
      // Check for specific Firebase errors
      if (error?.code === 'permission-denied') {
        throw new FirestorePermissionError(
          'Das Workout konnte nicht erstellt werden: Zugriff verweigert. ' +
          'Bitte gehe zur Firebase Console > Firestore Database > Rules und veröffentliche diese Rules:\n\n' +
          `rules_version = '2';\n` +
          `service cloud.firestore {\n` +
          `  match /databases/{database}/documents {\n` +
          `    match /workouts/{workoutId} {\n` +
          `      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;\n` +
          `    }\n` +
          `  }\n` +
          `}`
        );
      }
      
      throw parseFirestoreError(error);
    }
  },

  // Update a workout
  async updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<void> {
    try {
      const docRef = doc(db, 'workouts', workoutId);
      const updateData: any = { ...updates };
      
      if (updates.startedAt) {
        updateData.startedAt = Timestamp.fromDate(updates.startedAt);
      }
      if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
      }
      
      await updateDoc(docRef, updateData);
      console.log('Workout updated successfully:', workoutId);
    } catch (error: any) {
      console.error('Error updating workout:', error);
      throw parseFirestoreError(error);
    }
  },

  // Delete a workout and all its sets
  async deleteWorkout(workoutId: string): Promise<void> {
    try {
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
      console.log('Workout and associated sets deleted:', workoutId);
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      throw parseFirestoreError(error);
    }
  },
};

// Set Operations
export const setService = {
  // Get all sets for a workout
  async getSets(workoutId: string): Promise<Set[]> {
    try {
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
    } catch (error: any) {
      console.error('Error getting sets:', error);
      throw parseFirestoreError(error);
    }
  },

  // Create a set
  async createSet(set: Omit<Set, 'id'>): Promise<string> {
    try {
      if (!set.userId) {
        throw new Error('User ID ist erforderlich');
      }
      if (!set.workoutId) {
        throw new Error('Workout ID ist erforderlich');
      }

      const docRef = await addDoc(collection(db, 'sets'), {
        ...set,
        completedAt: Timestamp.fromDate(set.completedAt),
      });
      
      console.log('Set created successfully:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating set:', error);
      throw parseFirestoreError(error);
    }
  },

  // Create multiple sets (batch)
  async createSets(sets: Omit<Set, 'id'>[]): Promise<string[]> {
    if (sets.length === 0) return [];
    
    try {
      const batch = writeBatch(db);
      const ids: string[] = [];
      
      sets.forEach((set) => {
        if (!set.userId) {
          throw new Error('User ID ist für alle Sets erforderlich');
        }
        
        const docRef = doc(collection(db, 'sets'));
        batch.set(docRef, {
          ...set,
          completedAt: Timestamp.fromDate(set.completedAt),
        });
        ids.push(docRef.id);
      });
      
      await batch.commit();
      console.log('Sets created successfully:', ids.length, 'sets');
      return ids;
    } catch (error: any) {
      console.error('Error creating sets:', error);
      throw parseFirestoreError(error);
    }
  },

  // Delete a set
  async deleteSet(setId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'sets', setId));
      console.log('Set deleted successfully:', setId);
    } catch (error: any) {
      console.error('Error deleting set:', error);
      throw parseFirestoreError(error);
    }
  },
};

// Workout Plan Operations
export const planService = {
  // Get all plans for a user
  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
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
    } catch (error: any) {
      console.error('Error getting plans:', error);
      throw parseFirestoreError(error);
    }
  },

  // Create a plan
  async createPlan(plan: Omit<WorkoutPlan, 'id'>): Promise<string> {
    try {
      if (!plan.userId) {
        throw new Error('User ID ist erforderlich');
      }

      const docRef = await addDoc(collection(db, 'plans'), {
        ...plan,
        createdAt: Timestamp.fromDate(plan.createdAt),
      });
      
      console.log('Plan created successfully:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating plan:', error);
      throw parseFirestoreError(error);
    }
  },

  // Update a plan
  async updatePlan(planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    try {
      const docRef = doc(db, 'plans', planId);
      const updateData: any = { ...updates };
      
      if (updates.createdAt) {
        updateData.createdAt = Timestamp.fromDate(updates.createdAt);
      }
      
      await updateDoc(docRef, updateData);
      console.log('Plan updated successfully:', planId);
    } catch (error: any) {
      console.error('Error updating plan:', error);
      throw parseFirestoreError(error);
    }
  },

  // Delete a plan
  async deletePlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'plans', planId));
      console.log('Plan deleted successfully:', planId);
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      throw parseFirestoreError(error);
    }
  },
};

// Migration helper: Transfer localStorage data to Firestore
export const migrateLocalStorageToFirestore = async (userId: string) => {
  const results = {
    workouts: { success: 0, failed: 0, errors: [] as string[] },
    sets: { success: 0, failed: 0, errors: [] as string[] },
    plans: { success: 0, failed: 0, errors: [] as string[] },
  };

  try {
    // Migrate workouts
    const localWorkouts = JSON.parse(localStorage.getItem('fittrack_workouts') || '[]');
    for (const workout of localWorkouts) {
      try {
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
        results.workouts.success++;
        
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
          results.sets.success += setsToCreate.length;
        }
      } catch (e: any) {
        results.workouts.failed++;
        results.workouts.errors.push(`Workout ${workout.name}: ${e.message}`);
      }
    }
    
    // Migrate plans
    const localPlans = JSON.parse(localStorage.getItem('fittrack_plans') || '[]');
    for (const plan of localPlans) {
      if (!plan.id.startsWith('default-')) {
        try {
          await planService.createPlan({
            userId,
            name: plan.name,
            description: plan.description,
            exercises: plan.exercises,
            createdAt: new Date(plan.created_at),
          });
          results.plans.success++;
        } catch (e: any) {
          results.plans.failed++;
          results.plans.errors.push(`Plan ${plan.name}: ${e.message}`);
        }
      }
    }
    
    // Only clear localStorage if migration was mostly successful
    if (results.workouts.failed === 0 && results.plans.failed === 0) {
      localStorage.removeItem('fittrack_workouts');
      localStorage.removeItem('fittrack_plans');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('fittrack_workout_')) {
          localStorage.removeItem(key);
        }
      }
    }
    
    return { 
      success: results.workouts.failed === 0, 
      results,
      message: `Migration abgeschlossen: ${results.workouts.success} Workouts, ${results.sets.success} Sets, ${results.plans.success} Pläne migriert.`
    };
  } catch (error: any) {
    return { 
      success: false, 
      results,
      error: `Migration fehlgeschlagen: ${error.message}` 
    };
  }
};

// Export error classes for use in components
export { FirestoreError };
