/**
 * Unwrap a Supabase query result, throwing on error.
 * Replaces the repetitive `const { data, error } = ...; if (error) throw error; return data;` pattern.
 */
export async function query<T>(
  promise: PromiseLike<{ data: T; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}
