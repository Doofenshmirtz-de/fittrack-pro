import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { workoutService } from '@/lib/firestore';

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

    if (!user) {
      toast.error('Bitte melde dich an');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Erstelle neues Workout in Firestore
      const workoutId = await workoutService.createWorkout({
        userId: user.id,
        name: workoutName,
        startedAt: new Date(),
        completedAt: null,
        isActive: true,
      });

      toast.success('Workout gestartet!');
      navigate(`/workout/${workoutId}`);
    } catch (error: any) {
      console.error('Error creating workout:', error);
      toast.error('Fehler beim Erstellen des Workouts: ' + (error.message || 'Unbekannter Fehler'));
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
