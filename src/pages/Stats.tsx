import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface PersonalRecord {
  exercise_name: string;
  max_weight: number;
  achieved_at: string;
}

interface ProgressData {
  date: string;
  estimated_1rm: number;
}

const Stats = () => {
  const { user } = useAuth();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Load personal records (highest weight per exercise)
      const { data: prData, error: prError } = await supabase
        .from('sets')
        .select(`
          weight,
          reps,
          completed_at,
          exercises (name)
        `)
        .order('weight', { ascending: false });

      if (prError) throw prError;

      // Group by exercise and get max weight
      const recordsMap = new Map<string, PersonalRecord>();
      prData?.forEach((set: any) => {
        const exerciseName = set.exercises.name;
        const currentRecord = recordsMap.get(exerciseName);
        
        if (!currentRecord || set.weight > currentRecord.max_weight) {
          recordsMap.set(exerciseName, {
            exercise_name: exerciseName,
            max_weight: set.weight,
            achieved_at: set.completed_at
          });
        }
      });

      setPersonalRecords(Array.from(recordsMap.values()).slice(0, 5));

      // Load progress data for chart (example with bench press)
      const { data: progressSets, error: progressError } = await supabase
        .from('sets')
        .select(`
          weight,
          reps,
          completed_at,
          exercises (name)
        `)
        .eq('exercises.name', 'Bankdrücken')
        .order('completed_at', { ascending: true });

      if (progressError) throw progressError;

      // Calculate estimated 1RM using Epley formula: weight × (1 + reps/30)
      const chartData = progressSets?.map((set: any) => ({
        date: new Date(set.completed_at).toLocaleDateString('de-DE', { 
          month: 'short', 
          day: 'numeric' 
        }),
        estimated_1rm: Math.round(set.weight * (1 + set.reps / 30))
      })) || [];

      setProgressData(chartData);
    } catch (error: any) {
      toast.error('Fehler beim Laden der Statistiken');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Statistiken</h1>

        {/* Personal Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Persönliche Rekorde
            </CardTitle>
            <CardDescription>Deine besten Leistungen</CardDescription>
          </CardHeader>
          <CardContent>
            {personalRecords.length > 0 ? (
              <div className="space-y-3">
                {personalRecords.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{record.exercise_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.achieved_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {record.max_weight}kg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Noch keine Rekorde. Starte dein erstes Workout!
              </p>
            )}
          </CardContent>
        </Card>

        {/* 1RM Progress Chart */}
        {progressData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                1RM Progression - Bankdrücken
              </CardTitle>
              <CardDescription>
                Geschätztes Maximalgewicht über Zeit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="estimated_1rm" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Stats;
