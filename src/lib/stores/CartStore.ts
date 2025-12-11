// src/lib/stores/CartStore.ts
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface CartItem {
  id: number;
  title: string;
  artist: string;
  price: number;
  img: string;
  slug: string;
  quantity: number;
  stock: number;
}

// Usar persistentAtom para guardar en localStorage
export const cartItems = persistentAtom<CartItem[]>('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number) {
  const currentCart = cartItems.get();
  const existingItem = currentCart.find((i) => i.id === item.id);

  if (existingItem) {
    // Verificar stock antes de incrementar
    if (existingItem.quantity >= item.stock) {
      return false; // No se puede agregar más
    }
    cartItems.set(
      currentCart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  } else {
    cartItems.set([...currentCart, { ...item, quantity: 1 }]);
  }
  return true;
}

export function removeFromCart(id: number) {
  const currentCart = cartItems.get();
  cartItems.set(currentCart.filter((item) => item.id !== id));
}

export function updateQuantity(id: number, quantity: number) {
  if (quantity < 1) {
    removeFromCart(id);
    return true;
  }

  const currentCart = cartItems.get();
  const item = currentCart.find((i) => i.id === id);

  if (!item) return false;

  // Verificar stock
  if (quantity > item.stock) {
    return false;
  }

  cartItems.set(
    currentCart.map((i) => (i.id === id ? { ...i, quantity } : i))
  );
  return true;
}

export function clearCart() {
  cartItems.set([]);
}

export function getCartTotal() {
  const currentCart = cartItems.get();
  return currentCart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartCount() {
  const currentCart = cartItems.get();
  return currentCart.reduce((count, item) => count + item.quantity, 0);
}