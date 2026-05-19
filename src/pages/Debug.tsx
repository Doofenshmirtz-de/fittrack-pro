import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { auth, db } from '@/lib/firebase';
import { workoutService, setService, planService } from '@/lib/firestore';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bug, 
  Database, 
  User, 
  Server, 
  HardDrive, 
  RefreshCw, 
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface DebugData {
  auth: {
    isAuthenticated: boolean;
    user: any;
    authState: string;
  };
  firestore: {
    workouts: any[];
    sets: any[];
    plans: any[];
    connectionStatus: string;
  };
  localStorage: {
    keys: string[];
    data: Record<string, any>;
  };
  firebase: {
    projectId: string;
    authDomain: string;
    isInitialized: boolean;
  };
  network: {
    isOnline: boolean;
    userAgent: string;
  };
  errors: string[];
}

const Debug = () => {
  const { user, loading: authLoading } = useAuth();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const collectDebugData = async () => {
    const newErrors: string[] = [];
    
    try {
      setLoading(true);
      
      // Auth Status
      const authData = {
        isAuthenticated: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          username: user.username,
        } : null,
        authState: authLoading ? 'loading' : (user ? 'authenticated' : 'unauthenticated'),
      };

      // Firestore Data
      let firestoreData = {
        workouts: [],
        sets: [],
        plans: [],
        connectionStatus: 'unknown',
      };

      if (user) {
        try {
          const workouts = await workoutService.getWorkouts(user.id);
          firestoreData.workouts = workouts.map(w => ({
            id: w.id,
            name: w.name,
            userId: w.userId,
            isActive: w.isActive,
            startedAt: w.startedAt?.toISOString(),
          }));
          firestoreData.connectionStatus = 'connected';
        } catch (e: any) {
          firestoreData.connectionStatus = 'error';
          newErrors.push(`Firestore Workouts Error: ${e.message}`);
        }

        try {
          // Get sets for first workout if exists
          if (firestoreData.workouts.length > 0) {
            const sets = await setService.getSets(firestoreData.workouts[0].id);
            firestoreData.sets = sets.slice(0, 5).map(s => ({
              id: s.id,
              workoutId: s.workoutId,
              exerciseName: s.exercise?.name,
              weight: s.weight,
              reps: s.reps,
            }));
          }
        } catch (e: any) {
          newErrors.push(`Firestore Sets Error: ${e.message}`);
        }

        try {
          const plans = await planService.getPlans(user.id);
          firestoreData.plans = plans.map(p => ({
            id: p.id,
            name: p.name,
            userId: p.userId,
            exercisesCount: p.exercises?.length || 0,
          }));
        } catch (e: any) {
          newErrors.push(`Firestore Plans Error: ${e.message}`);
        }
      }

      // LocalStorage Data
      const localStorageData: Record<string, any> = {};
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fittrack')) {
          keys.push(key);
          try {
            localStorageData[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      // Firebase Config (sanitized)
      const firebaseConfig = {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'not-set',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'not-set',
        isInitialized: !!db && !!auth,
      };

      // Network Status
      const networkData = {
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent,
      };

      setDebugData({
        auth: authData,
        firestore: firestoreData,
        localStorage: {
          keys,
          data: localStorageData,
        },
        firebase: firebaseConfig,
        network: networkData,
        errors: newErrors,
      });

      setErrors(newErrors);
    } catch (e: any) {
      setErrors([...newErrors, `General Error: ${e.message}`]);
      toast.error('Fehler beim Sammeln der Debug-Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    collectDebugData();
  }, [user]);

  const copyToClipboard = () => {
    if (!debugData) return;
    
    const text = JSON.stringify(debugData, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Debug-Daten kopiert!');
  };

  const clearLocalStorage = () => {
    if (confirm('Bist du sicher? Dies löscht alle lokalen Daten!')) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith('fittrack')) {
          localStorage.removeItem(key);
        }
      }
      toast.success('LocalStorage gelöscht');
      collectDebugData();
    }
  };

  const testFirestoreConnection = async () => {
    if (!user) {
      toast.error('Nicht eingeloggt');
      return;
    }

    try {
      setLoading(true);
      const testWorkout = await workoutService.createWorkout({
        userId: user.id,
        name: 'Test Workout (Debug)',
        startedAt: new Date(),
        completedAt: null,
        isActive: false,
      });
      
      await workoutService.deleteWorkout(testWorkout);
      
      toast.success('Firestore-Verbindung funktioniert!');
    } catch (e: any) {
      toast.error(`Firestore-Fehler: ${e.message}`);
      setErrors([...errors, `Connection Test: ${e.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-6 w-6 text-destructive" />
            <h1 className="text-2xl font-bold">Debug</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={!debugData}
            >
              <Copy className="h-4 w-4 mr-1" />
              Kopieren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collectDebugData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Lade Debug-Daten...</p>
            </CardContent>
          </Card>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Card className="border-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5" />
                Fehler ({errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {debugData && (
          <>
            {/* Auth Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-5 w-5 text-primary" />
                  Authentifizierung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {debugData.auth.isAuthenticated ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {debugData.auth.isAuthenticated ? 'Eingeloggt' : 'Nicht eingeloggt'}
                  </span>
                </div>
                
                {debugData.auth.user && (
                  <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                    <div><strong>User ID:</strong> {debugData.auth.user.id}</div>
                    <div><strong>Email:</strong> {debugData.auth.user.email}</div>
                    <div><strong>Username:</strong> {debugData.auth.user.username}</div>
                  </div>
                )}
                
                <Badge variant={debugData.auth.isAuthenticated ? 'default' : 'destructive'}>
                  Status: {debugData.auth.authState}
                </Badge>
              </CardContent>
            </Card>

            {/* Firebase Config */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-5 w-5 text-primary" />
                  Firebase Konfiguration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>Project ID:</strong> {debugData.firebase.projectId}</div>
                <div><strong>Auth Domain:</strong> {debugData.firebase.authDomain}</div>
                <div className="flex items-center gap-2">
                  <strong>Initialisiert:</strong>
                  {debugData.firebase.isInitialized ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Firestore Data */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-primary" />
                  Firestore Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={debugData.firestore.connectionStatus === 'connected' ? 'default' : 'destructive'}>
                    {debugData.firestore.connectionStatus}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testFirestoreConnection}
                    disabled={!user || loading}
                  >
                    Verbindung testen
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted p-2 rounded">
                    <div className="text-2xl font-bold">{debugData.firestore.workouts.length}</div>
                    <div className="text-xs text-muted-foreground">Workouts</div>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <div className="text-2xl font-bold">{debugData.firestore.sets.length}</div>
                    <div className="text-xs text-muted-foreground">Sets</div>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <div className="text-2xl font-bold">{debugData.firestore.plans.length}</div>
                    <div className="text-xs text-muted-foreground">Pläne</div>
                  </div>
                </div>

                {debugData.firestore.workouts.length > 0 && (
                  <div className="text-sm">
                    <strong>Letzte Workouts:</strong>
                    <div className="mt-1 space-y-1">
                      {debugData.firestore.workouts.slice(0, 3).map((w, i) => (
                        <div key={i} className="bg-muted p-2 rounded text-xs">
                          {w.name} ({w.isActive ? 'Aktiv' : 'Abgeschlossen'})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LocalStorage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-5 w-5 text-primary" />
                  LocalStorage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <strong>{debugData.localStorage.keys.length}</strong> Einträge gefunden
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearLocalStorage}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </div>

                {debugData.localStorage.keys.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {debugData.localStorage.keys.map((key) => (
                      <div key={key} className="text-xs bg-muted p-2 rounded flex justify-between">
                        <span className="truncate">{key}</span>
                        <span className="text-muted-foreground">
                          {JSON.stringify(debugData.localStorage.data[key]).length} chars
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Network Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-5 w-5 text-primary" />
                  Netzwerk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <strong>Online:</strong>
                  {debugData.network.isOnline ? (
                    <Badge variant="default">Ja</Badge>
                  ) : (
                    <Badge variant="destructive">Nein</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  <strong>User Agent:</strong> {debugData.network.userAgent}
                </div>
              </CardContent>
            </Card>

            {/* Raw JSON */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Raw Debug Data (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-60 overflow-y-auto">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Debug;
