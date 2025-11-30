import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const NewWorkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    setLoading(true);

    try {
      // Erstelle neues Workout
      const workoutId = `workout-${Date.now()}`;
      const newWorkout = {
        id: workoutId,
        user_id: user?.id,
        name: workoutName,
        started_at: new Date().toISOString(),
        completed_at: null,
        is_active: true
      };

      // Füge Workout zur Liste hinzu
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      const workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];
      workouts.unshift(newWorkout);
      localStorage.setItem('fittrack_workouts', JSON.stringify(workouts));

      toast.success('Workout gestartet!');
      navigate(`/workout/${workoutId}`);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && workoutName.trim()) {
                  handleStartWorkout();
                }
              }}
              autoFocus
            />
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStartWorkout}
          disabled={loading || !workoutName.trim()}
          size="lg"
          className="w-full"
        >
          {loading ? 'Wird gestartet...' : 'Workout starten'}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Du kannst Übungen während des Trainings hinzufügen
        </p>
      </div>
    </div>
  );
};

export default NewWorkout;
