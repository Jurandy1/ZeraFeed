-- Clientes autenticados gerenciam só o próprio token (sem service_role no app).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_page_secrets TO authenticated;

CREATE POLICY "secrets_own"
  ON public.facebook_page_secrets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
