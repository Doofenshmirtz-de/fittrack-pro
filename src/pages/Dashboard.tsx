import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import WorkoutCard from '@/components/WorkoutCard';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface Workout {
  id: string;
  name: string;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      toast.error('Fehler beim Laden der Workouts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewWorkout = () => {
    navigate('/workout/new');
  };

  const handleContinueWorkout = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeWorkout = workouts.find(w => w.is_active);
  const completedWorkouts = workouts.filter(w => !w.is_active);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">FitTrack Pro</h1>
          <p className="text-muted-foreground">
            Bereit für dein nächstes Training?
          </p>
        </div>

        {/* Active Workout */}
        {activeWorkout && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Aktives Workout
            </h2>
            <WorkoutCard
              workout={activeWorkout}
              onContinue={() => handleContinueWorkout(activeWorkout.id)}
            />
          </div>
        )}

        {/* New Workout Button */}
        <Button
          onClick={handleNewWorkout}
          size="lg"
          className="w-full"
          disabled={!!activeWorkout}
        >
          <Plus className="mr-2 h-5 w-5" />
          Neues Workout starten
        </Button>

        {/* Recent Workouts */}
        {completedWorkouts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Letzte Workouts</h2>
            <div className="space-y-3">
              {completedWorkouts.map(workout => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          </div>
        )}

        {workouts.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-muted-foreground">
              <p className="text-lg">Noch keine Workouts</p>
              <p className="text-sm">Starte jetzt dein erstes Training!</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
