// src/pages/api/auth/session.ts
import type { APIRoute } from 'astro';
import { supabaseServer } from "../../../lib/supabaseServer";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    console.log('🔍 Verificando cookies...');
    console.log('Access Token:', accessToken ? 'SÍ existe' : 'NO existe');
    console.log('Refresh Token:', refreshToken ? 'SÍ existe' : 'NO existe');

    if (!accessToken || !refreshToken) {
      console.log('No hay tokens en cookies');
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabaseServer.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    console.log('Resultado setSession:', { 
      hasUser: !!data.user, 
      error: error?.message 
    });

    if (error || !data.user) {
      console.log('Error al verificar sesión:', error?.message);
      
      // Si el token expiró, limpiar cookies
      if (error?.message?.includes('expired')) {
        cookies.delete('sb-access-token', { path: '/' });
        cookies.delete('sb-refresh-token', { path: '/' });
      }
      
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Usuario autenticado:', data.user.email);

    return new Response(JSON.stringify({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Error en /api/auth/session:', err);
    return new Response(JSON.stringify({ 
      user: null,
      error: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};