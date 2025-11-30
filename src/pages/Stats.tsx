import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Calendar, Activity, Weight, Repeat, Timer, Dumbbell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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

interface ExerciseStats {
  name: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  maxWeight: number;
}

interface CategoryStats {
  category: string;
  totalVolume: number;
  totalSets: number;
}

const Stats = () => {
  const { user } = useAuth();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    avgRepsPerSet: 0,
    avgDuration: 0
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const storedWorkouts = localStorage.getItem('fittrack_workouts');
      if (!storedWorkouts) {
        setLoading(false);
        return;
      }

      const workouts = JSON.parse(storedWorkouts);
      const completedWorkouts = workouts.filter((w: any) => w.completed_at);
      
      const allSets: any[] = [];
      let totalDuration = 0;
      
      // Sammle alle Sets aus allen Workouts
      for (const workout of completedWorkouts) {
        const setsKey = `fittrack_workout_${workout.id}_sets`;
        const storedSets = localStorage.getItem(setsKey);
        if (storedSets) {
          const sets = JSON.parse(storedSets);
          allSets.push(...sets);
        }

        // Berechne Dauer
        if (workout.completed_at && workout.started_at) {
          const start = new Date(workout.started_at).getTime();
          const end = new Date(workout.completed_at).getTime();
          totalDuration += (end - start) / (1000 * 60); // in Minuten
        }
      }

      // Berechne Gesamt-Statistiken
      const totalSets = allSets.length;
      const totalReps = allSets.reduce((sum, set) => sum + (set.reps || 0), 0);
      const totalVolume = allSets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
      const avgRepsPerSet = totalSets > 0 ? Math.round(totalReps / totalSets) : 0;
      const avgDuration = completedWorkouts.length > 0 ? Math.round(totalDuration / completedWorkouts.length) : 0;

      setOverallStats({
        totalWorkouts: completedWorkouts.length,
        totalDuration: Math.round(totalDuration),
        totalSets,
        totalReps,
        totalVolume: Math.round(totalVolume),
        avgRepsPerSet,
        avgDuration
      });

      // Berechne persönliche Rekorde
      const recordsMap = new Map<string, PersonalRecord>();
      allSets.forEach((set: any) => {
        const exerciseName = set.exercise?.name || 'Unbekannt';
        const currentRecord = recordsMap.get(exerciseName);
        
        if (!currentRecord || (set.weight && set.weight > currentRecord.max_weight)) {
          recordsMap.set(exerciseName, {
            exercise_name: exerciseName,
            max_weight: set.weight || 0,
            achieved_at: set.completed_at
          });
        }
      });

      const records = Array.from(recordsMap.values())
        .sort((a, b) => b.max_weight - a.max_weight)
        .slice(0, 5);
      
      setPersonalRecords(records);

      // Berechne Übungs-Statistiken
      const exerciseMap = new Map<string, any>();
      allSets.forEach((set: any) => {
        const name = set.exercise?.name || 'Unbekannt';
        if (!exerciseMap.has(name)) {
          exerciseMap.set(name, {
            name,
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            maxWeight: 0
          });
        }
        const stats = exerciseMap.get(name);
        stats.totalSets += 1;
        stats.totalReps += set.reps || 0;
        stats.totalVolume += (set.weight || 0) * (set.reps || 0);
        stats.maxWeight = Math.max(stats.maxWeight, set.weight || 0);
      });

      const exStats = Array.from(exerciseMap.values())
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 10);
      setExerciseStats(exStats);

      // Berechne Kategorien-Statistiken
      const categoryMap = new Map<string, any>();
      allSets.forEach((set: any) => {
        const category = set.exercise?.muscle_group || 'Sonstiges';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            totalVolume: 0,
            totalSets: 0
          });
        }
        const stats = categoryMap.get(category);
        stats.totalVolume += (set.weight || 0) * (set.reps || 0);
        stats.totalSets += 1;
      });

      setCategoryStats(Array.from(categoryMap.values()));

      // Berechne Fortschrittsdaten für Bankdrücken
      const benchPressSets = allSets
        .filter(set => set.exercise?.name === 'Bankdrücken')
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

      if (benchPressSets.length > 0) {
        const chartData = benchPressSets.slice(-10).map((set: any) => ({
          date: new Date(set.completed_at).toLocaleDateString('de-DE', { 
            month: 'short', 
            day: 'numeric' 
          }),
          estimated_1rm: Math.round((set.weight || 0) * (1 + (set.reps || 0) / 30))
        }));
        setProgressData(chartData);
      }
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

        <Tabs defaultValue="gesamt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gesamt">Gesamt</TabsTrigger>
            <TabsTrigger value="uebungen">Übungen</TabsTrigger>
            <TabsTrigger value="kategorien">Kategorien</TabsTrigger>
          </TabsList>

          {/* Gesamtstatistik Tab */}
          <TabsContent value="gesamt" className="space-y-4">
            {/* Gesamt-Übersicht */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Gesamtstatistik
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Anzahl Trainings</p>
                  <p className="text-2xl font-bold">{overallStats.totalWorkouts}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Trainingsdauer</p>
                  <p className="text-2xl font-bold">{overallStats.totalDuration}min</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Sätze gesamt</p>
                  <p className="text-2xl font-bold">{overallStats.totalSets}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Wiederholungen</p>
                  <p className="text-2xl font-bold">{overallStats.totalReps}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Volumen (kg)</p>
                  <p className="text-2xl font-bold">{overallStats.totalVolume.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ø Wdh/Satz</p>
                  <p className="text-2xl font-bold">{overallStats.avgRepsPerSet}</p>
                </div>
              </CardContent>
            </Card>

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
          </TabsContent>

          {/* Übungen Tab */}
          <TabsContent value="uebungen" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Übungs-Statistiken
                </CardTitle>
                <CardDescription>Deine aktivsten Übungen</CardDescription>
              </CardHeader>
              <CardContent>
                {exerciseStats.length > 0 ? (
                  <div className="space-y-3">
                    {exerciseStats.map((stat, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{stat.name}</p>
                          <p className="text-sm font-bold text-primary">
                            {stat.maxWeight}kg
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="block">Sätze</span>
                            <span className="font-semibold text-foreground">{stat.totalSets}</span>
                          </div>
                          <div>
                            <span className="block">Wdh.</span>
                            <span className="font-semibold text-foreground">{stat.totalReps}</span>
                          </div>
                          <div>
                            <span className="block">Volumen</span>
                            <span className="font-semibold text-foreground">{Math.round(stat.totalVolume)}kg</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Noch keine Daten verfügbar
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kategorien Tab */}
          <TabsContent value="kategorien" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Weight className="h-5 w-5 text-primary" />
                  Kategorien-Statistiken
                </CardTitle>
                <CardDescription>Volumen nach Muskelgruppe</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryStats.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryStats}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="category" 
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
                          <Bar 
                            dataKey="totalVolume" 
                            fill="hsl(var(--primary))" 
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {categoryStats.map((stat, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{stat.category}</p>
                            <p className="text-sm text-muted-foreground">{stat.totalSets} Sätze</p>
                          </div>
                          <p className="font-bold text-primary">
                            {Math.round(stat.totalVolume).toLocaleString()}kg
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Noch keine Daten verfügbar
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Stats;
