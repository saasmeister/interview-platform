-- ============================================
-- FIX: RLS Policies (vervangt de recursieve policies)
-- Voer dit uit in de Supabase SQL Editor
-- ============================================

-- Stap 1: Maak een helper functie die RLS omzeilt
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Stap 2: Verwijder ALLE oude policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Stap 3: Nieuwe policies aanmaken

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- INTERVIEWS
CREATE POLICY "Admins can manage interviews"
  ON interviews FOR ALL
  USING (public.is_admin());

CREATE POLICY "Clients can view assigned interviews"
  ON interviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.interview_id = interviews.id
    AND assignments.client_id = auth.uid()
  ));

-- ASSIGNMENTS
CREATE POLICY "Admins can manage assignments"
  ON assignments FOR ALL
  USING (public.is_admin());

CREATE POLICY "Clients can view own assignments"
  ON assignments FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can update own assignments"
  ON assignments FOR UPDATE
  USING (client_id = auth.uid());

-- MESSAGES
CREATE POLICY "Admins can manage messages"
  ON messages FOR ALL
  USING (public.is_admin());

CREATE POLICY "Clients can view own messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = messages.assignment_id
    AND assignments.client_id = auth.uid()
  ));

CREATE POLICY "Clients can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM assignments
    WHERE assignments.id = messages.assignment_id
    AND assignments.client_id = auth.uid()
  ));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications"
  ON notifications FOR INSERT
  WITH CHECK (public.is_admin());
