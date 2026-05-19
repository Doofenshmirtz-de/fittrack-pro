import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Trash2, Edit, RotateCcw, Save, Share2, MoreVertical } from 'lucide-react';
import WorkoutCard from '@/components/WorkoutCard';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { workoutService, setService } from '@/lib/firestore';
import type { Workout, Set } from '@/lib/firestore';
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

interface WorkoutView {
  id: string;
  name: string;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutView[]>([]);
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
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedWorkouts = await workoutService.getWorkouts(user.id);
      
      // Convert Firestore Workout to view format
      const viewWorkouts: WorkoutView[] = fetchedWorkouts.map(w => ({
        id: w.id!,
        name: w.name,
        started_at: w.startedAt.toISOString(),
        completed_at: w.completedAt ? w.completedAt.toISOString() : null,
        is_active: w.isActive,
      }));
      
      setWorkouts(viewWorkouts);
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

  const handleEditWorkout = async (workoutId: string) => {
    try {
      await workoutService.updateWorkout(workoutId, {
        isActive: true,
        completedAt: null,
      });
      
      toast.success('Workout wird bearbeitet');
      navigate(`/workout/${workoutId}`);
    } catch (error) {
      toast.error('Fehler beim Öffnen');
    }
  };

  const handleRepeatWorkout = async (workoutId: string) => {
    if (!user) return;
    
    try {
      // Get old sets
      const oldSets = await setService.getSets(workoutId);
      
      const originalWorkout = workouts.find(w => w.id === workoutId);
      
      // Create new workout
      const newWorkoutId = await workoutService.createWorkout({
        userId: user.id,
        name: originalWorkout?.name || 'Wiederholung',
        startedAt: new Date(),
        completedAt: null,
        isActive: true,
      });

      // Copy sets with new IDs
      if (oldSets.length > 0) {
        const newSets: Omit<Set, 'id'>[] = oldSets.map((set, index) => ({
          workoutId: newWorkoutId,
          userId: user.id,
          exerciseId: set.exerciseId,
          exercise: set.exercise,
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          notes: set.notes,
          completedAt: new Date(),
          isRepeated: true,
        }));
        
        await setService.createSets(newSets);
      }

      toast.success('Training wiederholt!');
      navigate(`/workout/${newWorkoutId}`);
    } catch (error) {
      toast.error('Fehler beim Wiederholen');
    }
  };

  const handleSaveAsTemplate = async (workoutId: string) => {
    if (!user) return;
    
    try {
      const workout = workouts.find(w => w.id === workoutId);
      if (!workout) return;

      const sets = await setService.getSets(workoutId);
      
      if (sets.length === 0) {
        toast.error('Keine Übungen gefunden');
        return;
      }

      const exercisesMap = new Map();
      sets.forEach((set) => {
        if (set.exercise && !exercisesMap.has(set.exercise.id)) {
          exercisesMap.set(set.exercise.id, set.exercise);
        }
      });

      const exercises = Array.from(exercisesMap.values());

      // Create plan using localStorage for now (will be migrated later)
      const { planService } = await import('@/lib/firestore');
      await planService.createPlan({
        userId: user.id,
        name: workout.name,
        description: 'Aus Workout erstellt',
        exercises: exercises,
        createdAt: new Date(),
      });

      toast.success('Als Trainingsplan gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleShareWorkout = async (workoutId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    try {
      const sets = await setService.getSets(workoutId);
      
      let shareText = `🏋️ ${workout.name}\n\n`;
      
      const exercisesMap = new Map();
      sets.forEach((set) => {
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
      await workoutService.deleteWorkout(workoutId);
      
      toast.success('Workout gelöscht');
      loadWorkouts();
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
  }, {} as Record<string, WorkoutView[]>);

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
