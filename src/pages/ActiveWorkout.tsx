import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Trash2, ChevronRight, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { EXERCISES, type Exercise } from '@/lib/exercises';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  startWorkoutNotificationUpdates,
  closeWorkoutNotification,
  requestNotificationPermission,
  requestWakeLock,
  releaseWakeLock,
  setAppBadge,
  clearAppBadge,
  type WorkoutNotificationData
} from '@/lib/notifications';

interface Set {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
  completed_at: string;
}

interface ExerciseSession {
  exercise: Exercise;
  sets: Set[];
}

interface Workout {
  id: string;
  name: string;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  body_weight?: number | null;
  notes?: string | null;
}

// Custom Exercises Management
const getCustomExercises = (): Exercise[] => {
  const stored = localStorage.getItem('fittrack_custom_exercises');
  return stored ? JSON.parse(stored) : [];
};

const saveCustomExercise = (exercise: Omit<Exercise, 'id'>): Exercise => {
  const exercises = getCustomExercises();
  const newExercise: Exercise = {
    ...exercise,
    id: `custom-${Date.now()}`
  };
  exercises.push(newExercise);
  localStorage.setItem('fittrack_custom_exercises', JSON.stringify(exercises));
  return newExercise;
};

const ActiveWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseSessions, setExerciseSessions] = useState<ExerciseSession[]>([]);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  
  // Zeit-Bearbeitung
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  // Übungsauswahl States
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Custom Exercise Dialog
  const [showCustomExerciseDialog, setShowCustomExerciseDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('');
  
  // Set Input States
  const [showSetInput, setShowSetInput] = useState(false);
  const [newSet, setNewSet] = useState({ weight: '', reps: '', notes: '' });
  const [loading, setLoading] = useState(false);

  // Kombiniere vordefinierte und eigene Übungen
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const custom = getCustomExercises();
    setAllExercises([...EXERCISES, ...custom]);
  }, []);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId]);

  // Timer für Trainingsdauer
  useEffect(() => {
    if (!workout || !workout.is_active) return;

    const interval = setInterval(() => {
      const start = new Date(workout.started_at).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setElapsedTime(`${hours > 0 ? hours + 'h ' : ''}${minutes}min`);
    }, 1000);

    return () => clearInterval(interval);
  }, [workout]);

  // Persistent Notification für aktives Training
  useEffect(() => {
    if (!workout || !workout.is_active) return;

    // Notification Permission anfragen & Wake Lock aktivieren
    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        // Aktiviere Wake Lock
        await requestWakeLock();

        // Funktion die aktuelle Notification Daten liefert
        const getNotificationData = (): WorkoutNotificationData => {
          const start = new Date(workout.started_at).getTime();
          const now = new Date().getTime();
          const diff = now - start;
          
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const duration = `${hours > 0 ? hours + 'h ' : ''}${minutes}min`;

          // Aktuelle Übung (letzte hinzugefügte)
          const currentExercise = exerciseSessions.length > 0 
            ? exerciseSessions[exerciseSessions.length - 1].exercise.name
            : undefined;

          // Anzahl unterschiedlicher Übungen
          const totalExercises = exerciseSessions.length;
          const completedExercises = exerciseSessions.filter(s => s.sets.length > 0).length;

          return {
            workoutName: workout.name,
            duration,
            currentExercise,
            completedExercises,
            totalExercises
          };
        };

        // Starte Live-Updates (alle 10 Sekunden)
        startWorkoutNotificationUpdates(getNotificationData, 10000);

        // Badge mit Trainingsdauer in Minuten
        const totalMinutes = Math.floor((Date.now() - new Date(workout.started_at).getTime()) / (1000 * 60));
        setAppBadge(totalMinutes);
      }
    };

    initNotifications();

    // Cleanup beim Unmount
    return () => {
      closeWorkoutNotification();
      releaseWakeLock();
      clearAppBadge();
    };
  }, [workout, exerciseSessions]);

  const loadWorkoutData = async () => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const currentWorkout = workouts.find((w: Workout) => w.id === workoutId);
        if (currentWorkout) {
          setWorkout(currentWorkout);
          
          // Setze Zeit-Werte für Bearbeitung
          const startDate = new Date(currentWorkout.started_at);
          const startDateStr = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
          const startTimeStr = startDate.toTimeString().slice(0, 5); // HH:MM
          setEditStartDate(startDateStr);
          setEditStartTime(startTimeStr);
          
          if (currentWorkout.completed_at) {
            const endDate = new Date(currentWorkout.completed_at);
            const endTimeStr = endDate.toTimeString().slice(0, 5);
            setEditEndTime(endTimeStr);
          }
        }
      }

      const storedSets = localStorage.getItem(`fittrack_workout_${workoutId}_sets`);
      if (storedSets) {
        const sets = JSON.parse(storedSets);
        
        const grouped = sets.reduce((acc: ExerciseSession[], set: any) => {
          const exercise = set.exercise;
        const existing = acc.find(s => s.exercise.id === exercise.id);
        
        if (existing) {
          existing.sets.push(set);
        } else {
          acc.push({
            exercise,
            sets: [set]
          });
        }
        
        return acc;
        }, []);

      setExerciseSessions(grouped);
      }
    } catch (error: any) {
      toast.error('Fehler beim Laden des Workouts');
      console.error(error);
    }
  };

  const handleUpdateTime = () => {
    if (!workout) return;

    try {
      // Parse Datum und Zeit
      const [startHours, startMinutes] = editStartTime.split(':');
      const startDate = new Date(editStartDate);
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      let endDate = null;
      if (editEndTime && !workout.is_active) {
        const [endHours, endMinutes] = editEndTime.split(':');
        endDate = new Date(editStartDate); // Gleiches Datum wie Start
        endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        
        // Falls Endzeit vor Startzeit, dann am nächsten Tag
        if (endDate.getTime() < startDate.getTime()) {
          endDate.setDate(endDate.getDate() + 1);
        }
      }

      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = workouts.map((w: Workout) => {
          if (w.id === workoutId) {
            return {
              ...w,
              started_at: startDate.toISOString(),
              completed_at: endDate ? endDate.toISOString() : w.completed_at
            };
          }
          return w;
        });
        localStorage.setItem('fittrack_workouts', JSON.stringify(updatedWorkouts));
        loadWorkoutData();
        setIsEditingTime(false);
        toast.success('Datum & Zeit aktualisiert');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleCreateCustomExercise = () => {
    if (!newExerciseName.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    const newExercise = saveCustomExercise({
      name: newExerciseName,
      muscle_group: selectedCategory,
      equipment: newExerciseEquipment || null
    });

    const custom = getCustomExercises();
    setAllExercises([...EXERCISES, ...custom]);

    toast.success('Übung erstellt!');
    setShowCustomExerciseDialog(false);
    setNewExerciseName('');
    setNewExerciseEquipment('');
    
    handleExerciseSelect(newExercise);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategorySelect(false);
    setShowExerciseSelect(true);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseSelect(false);
    setShowSetInput(true);
  };

  const handleAddAnotherSet = (exercise: Exercise) => {
    const session = exerciseSessions.find(s => s.exercise.id === exercise.id);
    if (session && session.sets.length > 0) {
      const lastSet = session.sets[session.sets.length - 1];
      setNewSet({ 
        weight: String(lastSet.weight || ''), 
        reps: String(lastSet.reps || ''), 
        notes: '' 
      });
    }
    setSelectedExercise(exercise);
    setShowSetInput(true);
  };

  const handleAddSet = async () => {
    if (!selectedExercise || !newSet.weight || !newSet.reps) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    setLoading(true);

    try {
      const existingSession = exerciseSessions.find(
        s => s.exercise.id === selectedExercise.id
      );
      const setNumber = existingSession ? existingSession.sets.length + 1 : 1;

      const newSetData: any = {
        id: `set-${Date.now()}`,
          workout_id: workoutId,
        exercise_id: selectedExercise.id,
        exercise: selectedExercise,
          set_number: setNumber,
          weight: parseFloat(newSet.weight),
          reps: parseInt(newSet.reps),
        notes: newSet.notes || null,
        completed_at: new Date().toISOString()
      };

      const storedSets = localStorage.getItem(`fittrack_workout_${workoutId}_sets`);
      const sets = storedSets ? JSON.parse(storedSets) : [];
      sets.push(newSetData);
      localStorage.setItem(`fittrack_workout_${workoutId}_sets`, JSON.stringify(sets));

      toast.success('Satz hinzugefügt!');
      setNewSet({ weight: '', reps: '', notes: '' });
      setShowSetInput(false);
      setSelectedExercise(null);
      loadWorkoutData();
    } catch (error: any) {
      toast.error('Fehler beim Hinzufügen des Satzes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      const storedSets = localStorage.getItem(`fittrack_workout_${workoutId}_sets`);
      if (storedSets) {
        const sets = JSON.parse(storedSets);
        const updatedSets = sets.filter((s: any) => s.id !== setId);
        localStorage.setItem(`fittrack_workout_${workoutId}_sets`, JSON.stringify(updatedSets));
        toast.success('Satz gelöscht');
        loadWorkoutData();
      }
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleUpdateWorkoutDetails = async (bodyWeight: string, notes: string) => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = workouts.map((w: Workout) => {
          if (w.id === workoutId) {
            return {
              ...w,
              body_weight: bodyWeight ? parseFloat(bodyWeight) : null,
              notes: notes || null
            };
          }
          return w;
        });
        localStorage.setItem('fittrack_workouts', JSON.stringify(updatedWorkouts));
        loadWorkoutData();
      }
    } catch (error) {
      console.error('Fehler beim Speichern', error);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = workouts.map((w: Workout) => {
          if (w.id === workoutId) {
            return {
              ...w,
          completed_at: new Date().toISOString(),
          is_active: false
            };
          }
          return w;
        });
        localStorage.setItem('fittrack_workouts', JSON.stringify(updatedWorkouts));
      }

      // Cleanup Notifications, Wake Lock & Badge
      await closeWorkoutNotification();
      await releaseWakeLock();
      await clearAppBadge();

      toast.success('Workout abgeschlossen! 💪');
      navigate('/');
    } catch (error: any) {
      toast.error('Fehler beim Abschließen');
      console.error(error);
    }
  };

  if (!workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('de-DE', options).replace(',', '.,');
  };

  const startDateTime = formatDateTime(workout.started_at);
  const endDateTime = workout.completed_at ? formatDateTime(workout.completed_at) : '-';

  // Kategorien sammeln
  const categories = Array.from(new Set(allExercises.map(ex => ex.muscle_group))).sort();
  
  // Übungen der ausgewählten Kategorie
  const exercisesInCategory = selectedCategory
    ? allExercises.filter(ex => ex.muscle_group === selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header - kompakter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{workout.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {elapsedTime && <span>{elapsedTime}</span>}
              </div>
            </div>
          </div>
          <Button
            onClick={handleCompleteWorkout}
            variant="default"
            size="sm"
            className="bg-primary rounded-full"
          >
            Beenden
          </Button>
        </div>

        {/* Workout Details Card - kompakter */}
        <Card className="rounded-3xl">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm cursor-pointer" onClick={() => setIsEditingTime(true)}>
              <Label className="text-muted-foreground">Startzeit</Label>
              <span className="flex items-center gap-1">
                {startDateTime}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
            {!workout.is_active && (
              <div className="flex items-center justify-between text-sm cursor-pointer" onClick={() => setIsEditingTime(true)}>
                <Label className="text-muted-foreground">Endzeit</Label>
                <span className="flex items-center gap-1">
                  {endDateTime}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <Label className="text-muted-foreground">Körpergewicht</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="-"
                defaultValue={workout.body_weight || ''}
                onBlur={(e) => handleUpdateWorkoutDetails(e.target.value, workout.notes || '')}
                className="rounded-xl w-20 h-8 text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Datum & Zeit bearbeiten Dialog */}
        <Dialog open={isEditingTime} onOpenChange={setIsEditingTime}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Datum & Zeit anpassen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Startzeit</Label>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              {!workout.is_active && (
                <div className="space-y-2">
                  <Label>Endzeit</Label>
                  <Input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Falls Endzeit vor Startzeit liegt, wird nächster Tag angenommen
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingTime(false)}
                  className="flex-1 rounded-xl"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleUpdateTime}
                  className="flex-1 rounded-xl"
                >
                  Speichern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Kategorieauswahl - kompakter */}
        {showCategorySelect && (
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Kategorie</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCategorySelect(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {categories.map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors active:scale-[0.98]"
                >
                  <span className="font-medium">{category}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Übungsauswahl - kompakter */}
        {showExerciseSelect && (
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowExerciseSelect(false);
                    setShowCategorySelect(true);
                  }}
                  className="pl-0"
                >
                  ← {selectedCategory}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowExerciseSelect(false);
                    setSelectedCategory('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 max-h-80 overflow-y-auto">
              {/* Eigene Übung erstellen Button */}
              <div
                onClick={() => setShowCustomExerciseDialog(true)}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 cursor-pointer transition-colors active:scale-[0.98] border-2 border-dashed border-primary"
              >
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">Eigene Übung erstellen</span>
              </div>
              
              {exercisesInCategory.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => handleExerciseSelect(exercise)}
                  className="p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors active:scale-[0.98]"
                >
                  <p className="font-medium">{exercise.name}</p>
                  {exercise.equipment && (
                    <p className="text-xs text-muted-foreground">{exercise.equipment}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Custom Exercise Dialog */}
        <Dialog open={showCustomExerciseDialog} onOpenChange={setShowCustomExerciseDialog}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Neue Übung erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="z.B. Meine Spezialübung"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  className="rounded-xl"
                  autoFocus
                />
              </div>
                <div className="space-y-2">
                <Label>Equipment (optional)</Label>
                <Input
                  placeholder="z.B. Kurzhantel, Maschine..."
                  value={newExerciseEquipment}
                  onChange={(e) => setNewExerciseEquipment(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Kategorie: <span className="font-medium">{selectedCategory}</span>
              </div>
              <Button
                onClick={handleCreateCustomExercise}
                className="w-full rounded-xl"
              >
                Übung erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Set Input - kompakter */}
        {showSetInput && selectedExercise && (
          <Card className="rounded-3xl border-2 border-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedExercise.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSetInput(false);
                    setSelectedExercise(null);
                    setNewSet({ weight: '', reps: '', notes: '' });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Gewicht (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="60"
                    value={newSet.weight}
                    onChange={(e) => setNewSet({ ...newSet, weight: e.target.value })}
                    className="rounded-xl h-12 text-lg"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Wiederholungen</Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={newSet.reps}
                    onChange={(e) => setNewSet({ ...newSet, reps: e.target.value })}
                    className="rounded-xl h-12 text-lg"
                  />
                </div>
              </div>
              <Button onClick={handleAddSet} disabled={loading} className="w-full rounded-xl h-12">
                {loading ? 'Wird hinzugefügt...' : 'Satz speichern'}
              </Button>
              </CardContent>
            </Card>
        )}

        {/* Add Exercise Button */}
        {!showCategorySelect && !showExerciseSelect && !showSetInput && (
          <Button
            size="lg"
            className="w-full rounded-full h-14 text-base active:scale-[0.98] transition-transform"
            variant="default"
            onClick={() => setShowCategorySelect(true)}
          >
            + Übung hinzufügen
          </Button>
        )}

        {/* Exercise Sessions - kompakter */}
        <div className="space-y-3">
          {exerciseSessions.map((session) => (
            <Card key={session.exercise.id} className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{session.exercise.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {session.sets.map((set) => (
                      <div
                        key={set.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-2xl"
                      >
                      <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {set.set_number}
                          </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">{set.weight}kg</span>
                          <span className="text-muted-foreground">×</span>
                          <span className="font-medium">{set.reps}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSet(set.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    ))}
                  
                  {/* Add another set button - kompakter */}
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-dashed h-10 text-sm active:scale-[0.98] transition-transform"
                    onClick={() => handleAddAnotherSet(session.exercise)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Satz hinzufügen
                  </Button>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveWorkout;
