
DROP POLICY IF EXISTS "pools insert" ON public.reward_pools;
DROP POLICY IF EXISTS "pools update" ON public.reward_pools;
DROP POLICY IF EXISTS "rewards insert" ON public.pool_rewards;

CREATE POLICY "pools insert standard" ON public.reward_pools FOR INSERT TO authenticated
  WITH CHECK (total_etc = 0.01 AND period_end > now() AND is_open = true);

CREATE POLICY "pools close expired" ON public.reward_pools FOR UPDATE TO authenticated
  USING (period_end <= now());

CREATE POLICY "own rewards insert" ON public.pool_rewards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
