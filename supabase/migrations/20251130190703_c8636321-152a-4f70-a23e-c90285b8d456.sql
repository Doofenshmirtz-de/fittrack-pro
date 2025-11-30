-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create exercises table with predefined exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all exercises"
  ON public.exercises FOR SELECT
  USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Users can create custom exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_custom = true);

-- Insert predefined exercises
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom) VALUES
  ('Bankdrücken', 'Brust', 'Langhantel', false),
  ('Schrägbankdrücken', 'Brust', 'Langhantel', false),
  ('Fliegende', 'Brust', 'Kurzhanteln', false),
  ('Kniebeugen', 'Beine', 'Langhantel', false),
  ('Beinpresse', 'Beine', 'Maschine', false),
  ('Kreuzheben', 'Rücken', 'Langhantel', false),
  ('Klimmzüge', 'Rücken', 'Körpergewicht', false),
  ('Latziehen', 'Rücken', 'Maschine', false),
  ('Schulterdrücken', 'Schultern', 'Langhantel', false),
  ('Seitheben', 'Schultern', 'Kurzhanteln', false),
  ('Bizeps Curls', 'Arme', 'Kurzhanteln', false),
  ('Trizeps Dips', 'Arme', 'Körpergewicht', false),
  ('Beinstrecker', 'Beine', 'Maschine', false),
  ('Beinbeuger', 'Beine', 'Maschine', false),
  ('Wadenheben', 'Beine', 'Maschine', false);

-- Create workout_templates table
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON public.workout_templates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create template_exercises junction table
CREATE TABLE public.template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  target_sets INT,
  target_reps INT,
  UNIQUE(template_id, order_index)
);

ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage template exercises"
  ON public.template_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

-- Create workouts table for tracking sessions
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workouts"
  ON public.workouts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create sets table for tracking individual sets
CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  weight DECIMAL(10,2),
  reps INT,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sets"
  ON public.sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      WHERE id = workout_id AND user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX idx_sets_workout_exercise ON public.sets(workout_id, exercise_id);
CREATE INDEX idx_workouts_user_active ON public.workouts(user_id, is_active);
CREATE INDEX idx_sets_exercise_completed ON public.sets(exercise_id, completed_at);