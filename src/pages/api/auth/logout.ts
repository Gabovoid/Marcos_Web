import type { APIRoute } from 'astro';
import { supabaseServer } from "../../../lib/supabaseServer";

export const POST: APIRoute = async ({ cookies }) => {
  await supabaseServer.auth.signOut();
  
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};