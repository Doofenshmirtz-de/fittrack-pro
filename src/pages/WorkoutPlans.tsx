import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Play, Trash2, Copy, ChevronRight, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { EXERCISES, type Exercise } from '@/lib/exercises';
import { planService, workoutService, setService } from '@/lib/firestore';
import type { WorkoutPlan as FirestorePlan } from '@/lib/firestore';

interface WorkoutPlanView {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  created_at: string;
  isDefault?: boolean;
}

// Vordefinierte Trainingspläne
const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: 'default-1',
    name: 'Push Day',
    description: 'Brust, Schultern und Trizeps',
    exercises: [
      EXERCISES.find(e => e.name === 'Bankdrücken')!,
      EXERCISES.find(e => e.name === 'Schrägbankdrücken')!,
      EXERCISES.find(e => e.name === 'Schulterdrücken Kurzhanteln')!,
      EXERCISES.find(e => e.name === 'Seitheben')!,
      EXERCISES.find(e => e.name === 'Trizeps Extension Kabelzug')!,
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'default-2',
    name: 'Pull Day',
    description: 'Rücken und Bizeps',
    exercises: [
      EXERCISES.find(e => e.name === 'Kreuzheben')!,
      EXERCISES.find(e => e.name === 'Klimmzüge')!,
      EXERCISES.find(e => e.name === 'Langhantel Rudern')!,
      EXERCISES.find(e => e.name === 'Latziehen')!,
      EXERCISES.find(e => e.name === 'Bizeps Curls Kurzhanteln')!,
      EXERCISES.find(e => e.name === 'Hammercurls')!,
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'default-3',
    name: 'Leg Day',
    description: 'Beine und Core',
    exercises: [
      EXERCISES.find(e => e.name === 'Kniebeugen')!,
      EXERCISES.find(e => e.name === 'Beinpresse')!,
      EXERCISES.find(e => e.name === 'Beinbeuger')!,
      EXERCISES.find(e => e.name === 'Wadenheben (stehend)')!,
      EXERCISES.find(e => e.name === 'Planks')!,
    ],
    created_at: new Date().toISOString()
  }
];

const WorkoutPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<WorkoutPlanView[]>([]);
  const [loading, setLoading] = useState(false);

  // Creation/Edit States
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  // Exercise Selection States
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showExerciseSelect, setShowExerciseSelect] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadPlans();
  }, [user, navigate]);

  const loadPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userPlans = await planService.getPlans(user.id);

      // Convert Firestore plans to view format
      const viewPlans: WorkoutPlanView[] = userPlans.map(p => ({
        id: p.id!,
        name: p.name,
        description: p.description,
        exercises: p.exercises,
        created_at: p.createdAt.toISOString(),
      }));

      // Add default plans
      const defaultPlans: WorkoutPlanView[] = DEFAULT_PLANS.map(p => ({
        ...p,
        isDefault: true,
      }));

      setPlans([...defaultPlans, ...viewPlans]);
    } catch (error) {
      toast.error('Fehler beim Laden der Pläne');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingPlanId(null);
    setPlanName('');
    setPlanDescription('');
    setSelectedExercises([]);
    setShowCategorySelect(false);
    setShowExerciseSelect(false);
    setSelectedCategory('');
  };

  const handleStartCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEditing = (plan: WorkoutPlanView) => {
    if (plan.isDefault) {
      toast.error('Standard-Pläne können nicht bearbeitet werden');
      return;
    }
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDescription(plan.description);
    setSelectedExercises(plan.exercises);
    setIsCreating(true);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setShowCategorySelect(false);
    setShowExerciseSelect(true);
  };

  const handleExerciseToggle = (exercise: Exercise) => {
    const exists = selectedExercises.find(ex => ex.id === exercise.id);
    if (exists) {
      setSelectedExercises(selectedExercises.filter(ex => ex.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    if (selectedExercises.length === 0) {
      toast.error('Bitte wähle mindestens eine Übung');
      return;
    }

    if (!user) {
      toast.error('Bitte melde dich an');
      return;
    }

    try {
      if (editingPlanId) {
        // Update existing plan
        await planService.updatePlan(editingPlanId, {
          name: planName,
          description: planDescription,
          exercises: selectedExercises,
        });
        toast.success('Plan aktualisiert!');
      } else {
        // Create new plan
        await planService.createPlan({
          userId: user.id,
          name: planName,
          description: planDescription,
          exercises: selectedExercises,
          createdAt: new Date(),
        });
        toast.success('Plan erstellt!');
      }

      await loadPlans();
      resetForm();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleStartWorkout = async (plan: WorkoutPlanView) => {
    if (!user) {
      toast.error('Bitte melde dich an');
      return;
    }

    try {
      // Create workout in Firestore
      const workoutId = await workoutService.createWorkout({
        userId: user.id,
        name: plan.name,
        startedAt: new Date(),
        completedAt: null,
        isActive: true,
      });

      // Erstelle leere Sets für jede Übung im Plan (damit sie direkt sichtbar sind)
      const initialSets = plan.exercises.map((exercise, exerciseIndex) => ({
        workoutId: workoutId,
        userId: user.id,
        exerciseId: exercise.id,
        exercise: exercise,
        setNumber: 1,
        weight: null,
        reps: null,
        notes: null,
        completedAt: new Date(),
        isTemplate: true,
      }));

      await setService.createSets(initialSets);

      toast.success('Workout gestartet!');
      navigate(`/workout/${workoutId}`);
    } catch (error) {
      toast.error('Fehler beim Starten des Workouts');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (planId.startsWith('default-')) {
      toast.error('Standard-Pläne können nicht gelöscht werden');
      return;
    }

    try {
      await planService.deletePlan(planId);
      await loadPlans();
      toast.success('Plan gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleDuplicatePlan = async (plan: WorkoutPlanView) => {
    if (!user) {
      toast.error('Bitte melde dich an');
      return;
    }

    try {
      await planService.createPlan({
        userId: user.id,
        name: `${plan.name} (Kopie)`,
        description: plan.description,
        exercises: plan.exercises,
        createdAt: new Date(),
      });

      await loadPlans();
      toast.success('Plan dupliziert');
    } catch (error) {
      toast.error('Fehler beim Duplizieren');
    }
  };

  const categories = Array.from(new Set(EXERCISES.map(ex => ex.muscle_group))).sort();
  const exercisesInCategory = selectedCategory
    ? EXERCISES.filter(ex => ex.muscle_group === selectedCategory)
    : [];

  // Creation/Edit View
  if (isCreating) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {editingPlanId ? 'Plan bearbeiten' : 'Neuer Plan'}
            </h1>
            <Button
              variant="ghost"
              onClick={resetForm}
            >
              Abbrechen
            </Button>
          </div>

          <Card className="rounded-3xl">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="z.B. Push Day"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Input
                  placeholder="z.B. Brust, Schultern, Trizeps"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Selected Exercises */}
          {selectedExercises.length > 0 && (
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Ausgewählte Übungen ({selectedExercises.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedExercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted"
                  >
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-sm text-muted-foreground">{ex.muscle_group}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExerciseToggle(ex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Category Select */}
          {showCategorySelect && (
            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Kategorie wählen</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCategorySelect(false)}
                  >
                    Schließen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted cursor-pointer transition-colors border"
                  >
                    <span className="font-medium">{category}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Exercise Select */}
          {showExerciseSelect && (
            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowExerciseSelect(false);
                      setShowCategorySelect(true);
                    }}
                  >
                    ← {selectedCategory}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowExerciseSelect(false);
                      setSelectedCategory('');
                    }}
                  >
                    Schließen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {exercisesInCategory.map((exercise) => {
                  const isSelected = selectedExercises.find(ex => ex.id === exercise.id);
                  return (
                    <div
                      key={exercise.id}
                      onClick={() => handleExerciseToggle(exercise)}
                      className={`p-4 rounded-xl cursor-pointer transition-colors border-2 ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-transparent'
                      }`}
                    >
                      <p className="font-medium">{exercise.name}</p>
                      {exercise.equipment && (
                        <p className="text-sm text-muted-foreground">{exercise.equipment}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Add Exercise Button */}
          {!showCategorySelect && !showExerciseSelect && (
            <Button
              size="lg"
              className="w-full rounded-full"
              variant="outline"
              onClick={() => setShowCategorySelect(true)}
            >
              + Übungen hinzufügen
            </Button>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSavePlan}
            size="lg"
            className="w-full rounded-full"
            disabled={!planName.trim() || selectedExercises.length === 0}
          >
            {editingPlanId ? 'Plan aktualisieren' : 'Plan erstellen'}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Plans List View
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Trainingspläne</h1>
          <Button
            size="icon"
            onClick={handleStartCreating}
            className="rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {plans.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Noch keine Trainingspläne</p>
                <p className="text-sm">Erstelle deinen ersten Plan!</p>
              </CardContent>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="rounded-3xl">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription>{plan.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {plan.exercises.length} Übungen
                    </p>
                    {plan.exercises.map((ex, index) => (
                      <p key={index} className="text-sm">
                        • {ex.name}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartWorkout(plan)}
                      className="flex-1 rounded-xl"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Starten
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleStartEditing(plan)}
                      disabled={plan.isDefault}
                      className="rounded-xl"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDuplicatePlan(plan)}
                      className="rounded-xl"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={plan.isDefault}
                      className="rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default WorkoutPlans;
