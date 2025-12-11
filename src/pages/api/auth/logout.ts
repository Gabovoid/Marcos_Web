import type { APIRoute } from 'astro';
import { supabaseServer } from "../../../lib/supabaseServer";

export const POST: APIRoute = async ({ cookies }) => {
  // Cerrar sesión en el servidor
  await supabaseServer.auth.signOut();
  
  // Eliminar cookies
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });

  return new Response(JSON.stringify({ 
    success: true,
    clearSession: true 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};