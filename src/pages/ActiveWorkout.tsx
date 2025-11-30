import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Check, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

interface Exercise {
  id: string;
  name: string;
}

interface Set {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  notes: string | null;
}

interface ExerciseSession {
  exercise: Exercise;
  sets: Set[];
}

const ActiveWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState<ExerciseSession[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [newSet, setNewSet] = useState({ weight: '', reps: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutId]);

  const loadWorkoutData = async () => {
    try {
      // Load workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      // Load all exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*');

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

      // Load existing sets
      const { data: setsData, error: setsError } = await supabase
        .from('sets')
        .select(`
          *,
          exercises (id, name)
        `)
        .eq('workout_id', workoutId);

      if (setsError) throw setsError;

      // Group sets by exercise
      const grouped = setsData?.reduce((acc, set) => {
        const exercise = set.exercises as unknown as Exercise;
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
      }, [] as ExerciseSession[]) || [];

      setExerciseSessions(grouped);
    } catch (error: any) {
      toast.error('Fehler beim Laden des Workouts');
      console.error(error);
    }
  };

  const handleAddSet = async () => {
    if (!selectedExerciseId || !newSet.weight || !newSet.reps) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    setLoading(true);

    try {
      const existingSession = exerciseSessions.find(
        s => s.exercise.id === selectedExerciseId
      );
      const setNumber = existingSession ? existingSession.sets.length + 1 : 1;

      const { error } = await supabase
        .from('sets')
        .insert({
          workout_id: workoutId,
          exercise_id: selectedExerciseId,
          set_number: setNumber,
          weight: parseFloat(newSet.weight),
          reps: parseInt(newSet.reps),
          notes: newSet.notes || null
        });

      if (error) throw error;

      toast.success('Satz hinzugefügt!');
      setNewSet({ weight: '', reps: '', notes: '' });
      loadWorkoutData();
    } catch (error: any) {
      toast.error('Fehler beim Hinzufügen des Satzes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const { error } = await supabase
        .from('workouts')
        .update({
          completed_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', workoutId);

      if (error) throw error;

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
              <p className="text-sm text-muted-foreground">
                Aktives Training
              </p>
            </div>
          </div>
        </div>

        {/* Add Set Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              Satz hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Satz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Übung</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                >
                  <option value="">Übung wählen...</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gewicht (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="z.B. 60"
                    value={newSet.weight}
                    onChange={(e) => setNewSet({ ...newSet, weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wiederholungen</Label>
                  <Input
                    type="number"
                    placeholder="z.B. 10"
                    value={newSet.reps}
                    onChange={(e) => setNewSet({ ...newSet, reps: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notizen (optional)</Label>
                <Textarea
                  placeholder="Wie fühlte sich der Satz an?"
                  value={newSet.notes}
                  onChange={(e) => setNewSet({ ...newSet, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleAddSet} disabled={loading} className="w-full">
                {loading ? 'Wird hinzugefügt...' : 'Satz speichern'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise Sessions */}
        <div className="space-y-4">
          {exerciseSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Sätze</p>
                <p className="text-sm">Füge deinen ersten Satz hinzu!</p>
              </CardContent>
            </Card>
          ) : (
            exerciseSessions.map((session) => (
              <Card key={session.exercise.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    {session.exercise.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {session.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {set.set_number}
                          </div>
                          <div>
                            <p className="font-medium">
                              {set.weight}kg × {set.reps} Wdh.
                            </p>
                            {set.notes && (
                              <p className="text-xs text-muted-foreground">
                                {set.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Complete Workout */}
        {exerciseSessions.length > 0 && (
          <Button
            onClick={handleCompleteWorkout}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <Check className="mr-2 h-5 w-5" />
            Workout abschließen
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActiveWorkout;
