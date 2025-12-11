// src/components/Checkout/CheckoutForm.tsx
import { useStore } from '@nanostores/react';
import { cartItems, clearCart, getCartTotal } from '../../lib/stores/CartStore';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function CheckoutForm() {
  const cart = useStore(cartItems);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const total = getCartTotal();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando sesión...');
        
        // Verificar sesión con Supabase client (que tiene la sesión del login)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al verificar sesión:', error);
          window.location.href = '/login?redirect=/checkout';
          return;
        }

        if (!session) {
          console.log('❌ No hay sesión activa');
          alert('Debes iniciar sesión para continuar');
          window.location.href = '/login?redirect=/checkout';
          return;
        }
        
        console.log('✅ Usuario autenticado:', session.user.email);
        setUser(session.user);
      } catch (err) {
        console.error('❌ Error:', err);
        window.location.href = '/login?redirect=/checkout';
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = '/login?redirect=/checkout';
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          total: total,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la compra');
      }

      // Limpiar el carrito
      clearCart();
      setSuccess(true);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-[80px] px-4">
        <div className="bg-[#1A1A1A] p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-green-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Compra realizada correctamente
          </h2>
          <p className="text-gray-400 mb-6">
            Tu pedido ha sido procesado exitosamente. Serás redirigido al inicio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-[80px] mb-[50px] px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumen del pedido */}
        <div className="bg-[#1A1A1A] p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Resumen del Pedido</h2>

          {cart.length === 0 ? (
            <p className="text-gray-400">Tu carrito está vacío</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-gray-700 pb-4">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <p className="text-gray-400 text-xs">{item.artist}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-white text-sm">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-white font-semibold">
                        S/ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between text-white text-xl font-bold">
                  <span>Total:</span>
                  <span>S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información de compra */}
        <div className="bg-[#1A1A1A] p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Información</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700"
              />
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Método de pago</h3>
              <p className="text-gray-400 text-sm">
                El pago se procesará al momento de la entrega (contra entrega).
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Información importante</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Tiempo de entrega: 3-5 días hábiles</li>
                <li>• Envío gratuito en pedidos mayores a S/ 100</li>
                <li>• Recibirás un correo de confirmación</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading || cart.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {loading ? 'Procesando...' : 'Confirmar Compra'}
          </button>

          <a
            href="/"
            className="block text-center text-gray-400 hover:text-white mt-4 text-sm"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}