import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Dumbbell, TrendingUp, Clock, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface WorkoutCardProps {
  workout: {
    id: string;
    name: string;
    started_at: string;
    completed_at?: string;
  };
  onContinue?: () => void;
  menuTrigger?: React.ReactNode;
}

const WorkoutCard = ({ workout, onContinue, menuTrigger }: WorkoutCardProps) => {
  // Berechne Trainingsdauer
  const getDuration = () => {
    if (!workout.completed_at) return null;
    const start = new Date(workout.started_at).getTime();
    const end = new Date(workout.completed_at).getTime();
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  // Lade Übungen für dieses Workout
  const getExercises = () => {
    try {
      const storedSets = localStorage.getItem(`fittrack_workout_${workout.id}_sets`);
      if (!storedSets) return [];
      
      const sets = JSON.parse(storedSets);
      const exerciseMap = new Map();
      
      sets.forEach((set: any) => {
        const exerciseName = set.exercise?.name || 'Unbekannt';
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, 0);
        }
        exerciseMap.set(exerciseName, exerciseMap.get(exerciseName) + 1);
      });
      
      return Array.from(exerciseMap.entries()).map(([name, count]) => ({
        name,
        sets: count
      }));
    } catch {
      return [];
    }
  };

  const exercises = getExercises();
  const duration = getDuration();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {workout.name}
          </span>
          <div className="flex items-center gap-2">
            {duration && (
              <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {duration}
              </span>
            )}
            {menuTrigger}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(workout.started_at), 'PPP', { locale: de })}
        </div>
        
        {exercises.length > 0 && (
          <div className="space-y-1">
            {exercises.map((ex, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                {ex.sets}x {ex.name}
              </div>
            ))}
          </div>
        )}
        
        {!workout.completed_at && onContinue && (
          <Button onClick={onContinue} className="w-full">
            <TrendingUp className="mr-2 h-4 w-4" />
            Fortsetzen
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutCard;
