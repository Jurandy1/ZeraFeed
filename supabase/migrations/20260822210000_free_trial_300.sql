-- Contas novas começam no plano free (teste grátis) sem cobrança.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status, price, currency, expires_at)
  VALUES (NEW.id, 'free', 'trialing', 0, 'BRL', NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Contas já existentes em trial/pro sem pagamento → free
UPDATE public.subscriptions
SET plan = 'free', status = 'trialing', price = 0, expires_at = NULL
WHERE plan = 'pro' AND status = 'trialing';
