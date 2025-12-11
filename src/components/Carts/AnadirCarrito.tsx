// src/components/Cart/AddToCartButton.tsx
import { addToCart } from '../../lib/stores/CartStore';
import { useState } from 'react';

interface Props {
  vinyl: {
    id: number;
    title: string;
    artist: string;
    price: number;
    img: string;
    slug: string;
    stock: number;
  };
  quantity?: number;
  className?: string;
}

export default function AddToCartButton({ vinyl, quantity = 1, className = "" }: Props) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const success = addToCart(vinyl, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      alert('No hay suficiente stock disponible');
    }
  };

  return (
    <button
      onClick={handleAdd}
      className={`mt-3 w-full flex items-center justify-center gap-2 font-semibold py-2 rounded-lg transition cursor-pointer text-sm sm:text-base ${
        added
          ? 'bg-green-600 text-white'
          : 'bg-white hover:bg-[#4d5645] text-black hover:text-white'
      } ${className}`}
    >
      {added ? 'Agregado ✓' : 'Agregar'}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 stroke-[2]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    </button>
  );
}