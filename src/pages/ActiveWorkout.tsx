import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Trash2, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EXERCISES, type Exercise } from '@/lib/exercises';

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

const ActiveWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseSessions, setExerciseSessions] = useState<ExerciseSession[]>([]);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  
  // Übungsauswahl States
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Set Input States
  const [showSetInput, setShowSetInput] = useState(false);
  const [newSet, setNewSet] = useState({ weight: '', reps: '', notes: '' });
  const [loading, setLoading] = useState(false);

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

  const loadWorkoutData = async () => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const currentWorkout = workouts.find((w: Workout) => w.id === workoutId);
        if (currentWorkout) {
          setWorkout(currentWorkout);
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
    // Fülle Gewicht und Reps mit Werten vom letzten Satz
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

  // Kategorien sammeln
  const categories = Array.from(new Set(EXERCISES.map(ex => ex.muscle_group))).sort();
  
  // Übungen der ausgewählten Kategorie
  const exercisesInCategory = selectedCategory
    ? EXERCISES.filter(ex => ex.muscle_group === selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{workout.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {elapsedTime && <span>{elapsedTime}</span>}
              </div>
            </div>
          </div>
          <Button
            onClick={handleCompleteWorkout}
            variant="default"
            className="bg-primary rounded-full px-6"
          >
            Beenden
          </Button>
        </div>

        {/* Workout Details Card */}
        <Card className="rounded-3xl">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <Input
                value={workout.name}
                disabled
                className="bg-muted rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Startzeit</Label>
              <span className="text-sm">{startDateTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Endzeit</Label>
              <span className="text-sm text-muted-foreground">-</span>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Körpergewicht</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Optional"
                defaultValue={workout.body_weight || ''}
                onBlur={(e) => handleUpdateWorkoutDetails(e.target.value, workout.notes || '')}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center justify-between cursor-pointer">
                <span>Notizen</span>
                <ChevronRight className="h-4 w-4" />
              </Label>
              <Textarea
                placeholder="Optional"
                defaultValue={workout.notes || ''}
                onBlur={(e) => handleUpdateWorkoutDetails(String(workout.body_weight || ''), e.target.value)}
                className="min-h-[60px] rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Kategorieauswahl */}
        {showCategorySelect && (
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Übung auswählen</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCategorySelect(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-muted cursor-pointer transition-colors border"
                >
                  <span className="font-medium">{category}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Übungsauswahl (innerhalb Kategorie) */}
        {showExerciseSelect && (
          <Card className="rounded-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowExerciseSelect(false);
                    setSelectedCategory('');
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {exercisesInCategory.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => handleExerciseSelect(exercise)}
                  className="p-4 rounded-xl hover:bg-muted cursor-pointer transition-colors border"
                >
                  <p className="font-medium">{exercise.name}</p>
                  {exercise.equipment && (
                    <p className="text-sm text-muted-foreground">{exercise.equipment}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Set Input */}
        {showSetInput && selectedExercise && (
          <Card className="rounded-3xl border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedExercise.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSetInput(false);
                    setSelectedExercise(null);
                    setNewSet({ weight: '', reps: '', notes: '' });
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gewicht (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="z.B. 60"
                    value={newSet.weight}
                    onChange={(e) => setNewSet({ ...newSet, weight: e.target.value })}
                    className="rounded-xl"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wiederholungen</Label>
                  <Input
                    type="number"
                    placeholder="z.B. 10"
                    value={newSet.reps}
                    onChange={(e) => setNewSet({ ...newSet, reps: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notizen (optional)</Label>
                <Textarea
                  placeholder="Wie fühlte sich der Satz an?"
                  value={newSet.notes}
                  onChange={(e) => setNewSet({ ...newSet, notes: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleAddSet} disabled={loading} className="w-full rounded-xl">
                {loading ? 'Wird hinzugefügt...' : 'Satz speichern'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Exercise Button */}
        {!showCategorySelect && !showExerciseSelect && !showSetInput && (
          <Button
            size="lg"
            className="w-full rounded-full"
            variant="default"
            onClick={() => setShowCategorySelect(true)}
          >
            + Übung hinzufügen
          </Button>
        )}

        {/* Exercise Sessions */}
        <div className="space-y-4">
          {exerciseSessions.map((session) => (
            <Card key={session.exercise.id} className="rounded-3xl">
              <CardHeader>
                <CardTitle>{session.exercise.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {session.sets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-2xl"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {set.set_number}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs text-muted-foreground">Gewicht</span>
                              <p className="font-medium">{set.weight} kg</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">Wdh.</span>
                              <p className="font-medium">{set.reps}</p>
                            </div>
                          </div>
                          {set.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {set.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSet(set.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add another set button */}
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-dashed"
                    onClick={() => handleAddAnotherSet(session.exercise)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
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
