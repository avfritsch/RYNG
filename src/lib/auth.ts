import { supabase } from './supabase.ts';

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

export async function deleteAccount() {
  // Server-side deletion of the auth user; all user data cascades from there.
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw new Error(error.message || 'Konto konnte nicht gelöscht werden');
  if (data?.error) throw new Error(data.error);

  // Session is already invalid server-side; clear it locally.
  await supabase.auth.signOut({ scope: 'local' });
}
