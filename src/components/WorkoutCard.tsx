import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Dumbbell, TrendingUp } from 'lucide-react';
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
}

const WorkoutCard = ({ workout, onContinue }: WorkoutCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {workout.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(workout.started_at), 'PPP', { locale: de })}
        </div>
        
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
