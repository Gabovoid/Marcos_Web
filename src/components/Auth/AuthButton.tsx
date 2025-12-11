import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // ✅ IMPORTAR SUPABASE

// Iconos SVG en lugar de lucide-react
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogOutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface User {
  id: string;
  email: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSession();

    // ✅ NUEVO: Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || ''
        });
      }
    });

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function checkSession() {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      // 1. Llamar al endpoint del servidor para limpiar cookies
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. ✅ CRÍTICO: Limpiar sesión del cliente de Supabase
      await supabase.auth.signOut();
      
      // 3. Limpiar estado local
      setUser(null);
      setIsOpen(false);
      
      // 4. Redirigir
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  if (loading) {
    return (
      <div className="rounded-full p-3 sm:p-2 cursor-pointer text-white bg-black hover:bg-white hover:text-black transition">
        <UserIcon />
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-full p-3 sm:p-2 cursor-pointer text-white bg-black hover:bg-white hover:text-black transition"
      >
        <UserIcon />
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-3 sm:p-2 cursor-pointer text-white bg-black hover:bg-white hover:text-black transition"
      >
        <UserIcon />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-black text-white rounded-lg shadow-lg border border-white py-2 z-50">
          <div className="px-4 py-3 border-b border-white">
            <p className="text-sm font-semibold text-white">{user.email}</p>
            <p className="text-xs text-white mt-1">Cliente</p>
          </div>
          <a
            href="/compras"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 hover:text-black text-white transition"
          >
            <ShoppingBagIcon />
            <span className="font-medium">Mis Compras</span>
          </a>

          <div className="border-t border-white my-2"></div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 text-red-500 transition cursor-pointer"
          >
            <LogOutIcon />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}