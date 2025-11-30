import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Dumbbell, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
}

const NewWorkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('muscle_group')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error: any) {
      toast.error('Fehler beim Laden der Übungen');
      console.error(error);
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscle_group]) {
      acc[exercise.muscle_group] = [];
    }
    acc[exercise.muscle_group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  const toggleExercise = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    if (selectedExercises.size === 0) {
      toast.error('Bitte wähle mindestens eine Übung');
      return;
    }

    setLoading(true);

    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user?.id,
          name: workoutName,
          is_active: true
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      toast.success('Workout gestartet!');
      navigate(`/workout/${workout.id}`);
    } catch (error: any) {
      toast.error('Fehler beim Erstellen des Workouts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Neues Workout</h1>
        </div>

        {/* Workout Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workout Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="z.B. Push Day, Beine, etc."
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Exercise Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Übung suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Exercise Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Übungen wählen ({selectedExercises.size})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedExercises).map(([muscleGroup, exs]) => (
              <div key={muscleGroup} className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {muscleGroup}
                </h3>
                <div className="space-y-2">
                  {exs.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => toggleExercise(exercise.id)}
                    >
                      <Checkbox
                        checked={selectedExercises.has(exercise.id)}
                        onCheckedChange={() => toggleExercise(exercise.id)}
                      />
                      <Label className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          {exercise.equipment && (
                            <p className="text-xs text-muted-foreground">
                              {exercise.equipment}
                            </p>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStartWorkout}
          disabled={loading || !workoutName.trim() || selectedExercises.size === 0}
          size="lg"
          className="w-full"
        >
          {loading ? 'Wird gestartet...' : 'Workout starten'}
        </Button>
      </div>
    </div>
  );
};

export default NewWorkout;
