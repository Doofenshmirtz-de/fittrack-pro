import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Trash2 } from 'lucide-react';
import WorkoutCard from '@/components/WorkoutCard';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);

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
      // Lade Workouts aus localStorage
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const parsedWorkouts = JSON.parse(storedWorkouts);
        setWorkouts(parsedWorkouts);
      } else {
        // Beispiel-Daten für Demo
        const mockWorkouts: Workout[] = [
          {
            id: 'workout-1',
            name: 'Push Day',
            started_at: new Date(Date.now() - 86400000).toISOString(), // Gestern
            completed_at: new Date(Date.now() - 82800000).toISOString(),
            is_active: false
          },
          {
            id: 'workout-2',
            name: 'Bein Training',
            started_at: new Date(Date.now() - 259200000).toISOString(), // Vor 3 Tagen
            completed_at: new Date(Date.now() - 255600000).toISOString(),
            is_active: false
          }
        ];
        setWorkouts(mockWorkouts);
        localStorage.setItem('fittrack_workouts', JSON.stringify(mockWorkouts));
      }
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

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      // Lösche Workout
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = workouts.filter((w: Workout) => w.id !== workoutId);
        localStorage.setItem('fittrack_workouts', JSON.stringify(updatedWorkouts));
        
        // Lösche zugehörige Daten
        localStorage.removeItem(`fittrack_workout_${workoutId}_exercises`);
        localStorage.removeItem(`fittrack_workout_${workoutId}_sets`);
        
        toast.success('Workout gelöscht');
        loadWorkouts();
      }
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
    setDeleteWorkoutId(null);
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

  // Gruppiere Workouts nach Monat
  const groupedByMonth = completedWorkouts.reduce((acc, workout) => {
    const date = new Date(workout.started_at);
    const monthYear = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">FitTrack Pro</h1>
            <p className="text-muted-foreground">
              Bereit für dein nächstes Training?
            </p>
          </div>
          {completedWorkouts.length > 0 && (
            <Button
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Fertig' : 'Bearbeiten'}
            </Button>
          )}
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

        {/* Recent Workouts by Month */}
        {Object.entries(groupedByMonth).map(([monthYear, monthWorkouts]) => (
          <div key={monthYear} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{monthYear}</h2>
              <span className="text-sm text-muted-foreground">
                {monthWorkouts.length} Training{monthWorkouts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {monthWorkouts.map(workout => (
                <div key={workout.id} className="relative">
                  <WorkoutCard workout={workout} />
                  {isEditMode && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setDeleteWorkoutId(workout.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteWorkoutId} onOpenChange={() => setDeleteWorkoutId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workout löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Workout und alle zugehörigen Daten werden permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWorkoutId && handleDeleteWorkout(deleteWorkoutId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
