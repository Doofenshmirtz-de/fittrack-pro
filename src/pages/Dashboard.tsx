import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Trash2, Edit, RotateCcw, Save, Share2, MoreVertical } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            started_at: new Date(Date.now() - 86400000).toISOString(),
            completed_at: new Date(Date.now() - 82800000).toISOString(),
            is_active: false
          },
          {
            id: 'workout-2',
            name: 'Bein Training',
            started_at: new Date(Date.now() - 259200000).toISOString(),
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

  const handleEditWorkout = (workoutId: string) => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workoutsList = JSON.parse(storedWorkouts);
        const updatedWorkouts = workoutsList.map((w: Workout) => {
          if (w.id === workoutId) {
            return {
              ...w,
              is_active: true,
              completed_at: null
            };
          }
          return w;
        });
        localStorage.setItem('fittrack_workouts', JSON.stringify(updatedWorkouts));
        toast.success('Workout wird bearbeitet');
        navigate(`/workout/${workoutId}`);
      }
    } catch (error) {
      toast.error('Fehler beim Öffnen');
    }
  };

  const handleRepeatWorkout = (workoutId: string) => {
    try {
      const oldSets = localStorage.getItem(`fittrack_workout_${workoutId}_sets`);
      
      const newWorkoutId = `workout-${Date.now()}`;
      const originalWorkout = workouts.find(w => w.id === workoutId);
      
      const newWorkout = {
        id: newWorkoutId,
        user_id: user?.id,
        name: originalWorkout?.name || 'Wiederholung',
        started_at: new Date().toISOString(),
        completed_at: null,
        is_active: true
      };

      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      const workoutsList = storedWorkouts ? JSON.parse(storedWorkouts) : [];
      workoutsList.unshift(newWorkout);
      localStorage.setItem('fittrack_workouts', JSON.stringify(workoutsList));

      // Kopiere die alten Sets mit neuen IDs
      if (oldSets) {
        const parsedOldSets = JSON.parse(oldSets);
        const newSets = parsedOldSets.map((set: any, index: number) => ({
          ...set,
          id: `set-${Date.now()}-${index}`,
          workout_id: newWorkoutId,
          completed_at: new Date().toISOString(),
          is_repeated: true // Markiert als kopierter Satz
        }));
        localStorage.setItem(`fittrack_workout_${newWorkoutId}_sets`, JSON.stringify(newSets));
      }

      toast.success('Training wiederholt!');
      navigate(`/workout/${newWorkoutId}`);
    } catch (error) {
      toast.error('Fehler beim Wiederholen');
    }
  };

  const handleSaveAsTemplate = (workoutId: string) => {
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      const storedSets = localStorage.getItem(`fittrack_workout_${workoutId}_sets`);
      if (!storedSets) {
        toast.error('Keine Übungen gefunden');
        return;
      }

      const sets = JSON.parse(storedSets);
      const exercisesMap = new Map();
      sets.forEach((set: any) => {
        if (set.exercise && !exercisesMap.has(set.exercise.id)) {
          exercisesMap.set(set.exercise.id, set.exercise);
        }
      });

      const exercises = Array.from(exercisesMap.values());

      const newPlan = {
        id: `plan-${Date.now()}`,
        name: workout.name,
        description: 'Aus Workout erstellt',
        exercises: exercises,
        created_at: new Date().toISOString()
      };

      const storedPlans = localStorage.getItem('fittrack_plans');
      const plans = storedPlans ? JSON.parse(storedPlans) : [];
      plans.push(newPlan);
      localStorage.setItem('fittrack_plans', JSON.stringify(plans));

      toast.success('Als Trainingsplan gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleShareWorkout = async (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    try {
      const storedSets = localStorage.getItem(`fittrack_workout_${workoutId}_sets`);
      const sets = storedSets ? JSON.parse(storedSets) : [];
      
      let shareText = `🏋️ ${workout.name}\n\n`;
      
      const exercisesMap = new Map();
      sets.forEach((set: any) => {
        const exerciseName = set.exercise?.name || 'Unbekannt';
        if (!exercisesMap.has(exerciseName)) {
          exercisesMap.set(exerciseName, []);
        }
        exercisesMap.get(exerciseName).push(`${set.weight}kg × ${set.reps}`);
      });

      exercisesMap.forEach((setsList, exerciseName) => {
        shareText += `${exerciseName}:\n`;
        setsList.forEach((setInfo: string, index: number) => {
          shareText += `  ${index + 1}. ${setInfo}\n`;
        });
        shareText += '\n';
      });

      shareText += '💪 Erstellt mit FitTrack Pro';

      if (navigator.share) {
        await navigator.share({
          title: `Workout: ${workout.name}`,
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('In Zwischenablage kopiert!');
      }
    } catch (error) {
      console.error('Fehler beim Teilen', error);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (storedWorkouts) {
        const workoutsList = JSON.parse(storedWorkouts);
        const updatedWorkouts = workoutsList.filter((w: Workout) => w.id !== workoutId);
        localStorage.setItem('fittrack_workouts', JSON.stringify(updatedWorkouts));
        
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
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  menuTrigger={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleEditWorkout(workout.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRepeatWorkout(workout.id)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Training wiederholen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSaveAsTemplate(workout.id)}>
                          <Save className="mr-2 h-4 w-4" />
                          Als Trainingsplan speichern
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareWorkout(workout.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Teilen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteWorkoutId(workout.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
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
