
CREATE POLICY "pools insert" ON public.reward_pools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pools update" ON public.reward_pools FOR UPDATE TO authenticated USING (true);

CREATE POLICY "own contrib insert" ON public.pool_contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own contrib update" ON public.pool_contributions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "rewards insert" ON public.pool_rewards FOR INSERT TO authenticated WITH CHECK (true);
