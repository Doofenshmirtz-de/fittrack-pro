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
      
      // Detaillierte Fehlermeldungen
      let errorMessage = 'Fehler beim Erstellen des Workouts';
      
      if (error.name === 'FirestorePermissionError') {
        errorMessage = '🔒 Zugriff verweigert: Die Firebase Security Rules blockieren diese Aktion.\n\n' +
          'Lösung: Gehe zur Firebase Console > Firestore Database > Rules und füge diese Regel hinzu:\n\n' +
          'match /workouts/{workoutId} {\n' +
          '  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;\n' +
          '}';
      } else if (error.name === 'FirestoreNetworkError') {
        errorMessage = '🌐 Keine Internetverbindung. Bitte prüfe deine Netzwerkverbindung und versuche es erneut.';
      } else if (error.name === 'FirestoreIndexError') {
        errorMessage = '⏳ Der Firestore Index wird noch erstellt. Bitte warte 1-2 Minuten und versuche es dann erneut.';
      } else if (error.message?.includes('permission-denied')) {
        errorMessage = '🔒 Fehlende Berechtigung: Deine Firebase Security Rules erlauben das Erstellen von Workouts nicht.\n\n' +
          'Gehe zu https://console.firebase.google.com/project/fittrack-pro-eabdb/firestore/rules\n' +
          'und veröffentliche die aktuellen Rules aus der Datei firestore.rules';
      } else {
        errorMessage = `❌ Fehler: ${error.message || 'Unbekannter Fehler'}`;
      }
      
      toast.error(errorMessage, {
        duration: 10000, // 10 Sekunden anzeigen für lange Nachrichten
      });
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
