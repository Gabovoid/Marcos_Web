// src/pages/api/auth/login.ts
import type { APIContext } from "astro";
import { supabaseServer } from "../../../lib/supabaseServer";

export const prerender = false;

export async function POST({ request, cookies }: APIContext) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Email y contraseña son obligatorios" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Intentar hacer login
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error en login:", error);
      
      let mensaje = "Error al iniciar sesión";
      
      if (error.message.includes("Invalid login credentials")) {
        mensaje = "Email o contraseña incorrectos";
      } else if (error.message.includes("Email not confirmed")) {
        mensaje = "Debes confirmar tu email antes de iniciar sesión";
      }
      
      return new Response(
        JSON.stringify({ message: mensaje }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({ message: "No se pudo crear la sesión" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Guardar tokens en cookies (backend seguro)
    cookies.set("sb-access-token", data.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    cookies.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    console.log("Login exitoso para:", email);

    // ✅ Devolver la sesión completa al cliente
    return new Response(
      JSON.stringify({ 
        message: "Inicio de sesión exitoso",
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
        },
        user: {
          id: data.user.id,
          email: data.user.email,
        }
      }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("Error del servidor:", error);
    return new Response(
      JSON.stringify({ 
        message: "Error del servidor", 
        detail: error.message 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}