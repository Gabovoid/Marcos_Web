// src/pages/api/auth/register.ts
import type { APIContext } from "astro";
import { supabaseServer } from "../../../lib/supabaseServer";

export const prerender = false;

export async function POST({ request }: APIContext) {
  try {
    const body = await request.json();
    const { name, lastname, email, password, dni, phone, address } = body;

    if (!name || !lastname || !email || !password) {
      return new Response(
        JSON.stringify({ message: "Faltan campos obligatorios" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Registrar en Supabase Auth (el trigger se encarga del resto)
    const { data: authData, error: authError } = await supabaseServer.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          name, 
          lastname,
          dni: dni || null,
          phone: phone || null,
          address: address || null
        } 
      }
    });

    if (authError) {
      let mensaje = authError.message;
      if (authError.message.includes("already registered")) {
        mensaje = "Este email ya está registrado. ¿Quieres iniciar sesión?";
      }
      return new Response(
        JSON.stringify({ message: mensaje }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ El trigger ya insertó en public.users automáticamente
    console.log("Usuario registrado:", authData.user?.email);

    return new Response(
      JSON.stringify({ message: "Usuario registrado con éxito" }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error del servidor:", error);
    return new Response(
      JSON.stringify({ message: "Error del servidor" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}