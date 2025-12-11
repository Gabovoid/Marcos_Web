import { useStore } from '@nanostores/react';
import { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartCount } from '../../lib/stores/CartStore';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function CartWidget() {
  const cart = useStore(cartItems);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false); // ✅ Nuevo estado

  const total = getCartTotal();
  const count = getCartCount();

  // ✅ Marcar como montado en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Verificar si hay usuario autenticado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-3 sm:p-2 cursor-pointer hover:bg-white hover:text-black transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        {/* ✅ Solo mostrar el badge después de montar en el cliente */}
        {isMounted && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black z-40"
            style={{ opacity: 0.5 }}
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] shadow-lg z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Carrito ({count})</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-3 sm:p-2 cursor-pointer hover:bg-white hover:text-black transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-center mt-8">Tu carrito está vacío</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-gray-800 p-3 rounded-lg">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-white text-sm font-semibold line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-xs">{item.artist}</p>
                        <p className="text-white font-semibold mt-1">
                          S/ {item.price.toFixed(2)}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-700 text-white rounded hover:bg-gray-600"
                          >
                            -
                          </button>
                          <span className="text-white text-sm w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (!updateQuantity(item.id, item.quantity + 1)) {
                                alert('No hay más stock disponible');
                              }
                            }}
                            className="w-6 h-6 bg-gray-700 text-white rounded hover:bg-gray-600"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-500 hover:text-red-400 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-700 p-4">
                <div className="flex justify-between text-white mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold">S/ {total.toFixed(2)}</span>
                </div>
                <a
                  href={user ? '/checkout' : '/login?redirect=/checkout'}
                  className="block w-full bg-white text-black text-center py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Proceder al pago
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}