-- Allow authenticated students to view scheduled competitions for advance registration & waiting room
DROP POLICY IF EXISTS "Anyone can view active competitions" ON competitions;
CREATE POLICY "Anyone can view active competitions" ON competitions FOR SELECT
  USING (status IN ('scheduled','waiting_room','active','closed','results_published'));
