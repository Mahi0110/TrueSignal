-- The signup trigger calls this function internally; it is not a client RPC.
-- Revoking API execution does not remove the existing Auth trigger.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
