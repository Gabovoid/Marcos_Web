// src/pages/api/orders/create.ts
import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/supabaseServer';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { items, total, userId } = await request.json();

    console.log('📦 Creando orden con items:', items.length, 'total:', total);

    // Validar que haya items
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'El carrito está vacío' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    let authenticatedUserId = null;

    if (accessToken && refreshToken) {
      const { data: { user }, error: authError } = await supabaseServer.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (!authError && user) {
        authenticatedUserId = user.id;
        console.log('✅ Usuario autenticado desde cookies:', user.email);
      }
    }

    const finalUserId = authenticatedUserId || userId || null;

    console.log('👤 User ID para la orden:', finalUserId);

    // Verificar stock disponible antes de crear la orden
    for (const item of items) {
      const { data: vinyl, error } = await supabaseServer
        .from('vinyls')
        .select('stock, title')
        .eq('id', item.id)
        .single();

      if (error || !vinyl) {
        return new Response(
          JSON.stringify({ 
            error: `No se encontró el vinyl con ID ${item.id}` 
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (vinyl.stock < item.quantity) {
        return new Response(
          JSON.stringify({ 
            error: `Stock insuficiente para "${vinyl.title}". Disponible: ${vinyl.stock}, Solicitado: ${item.quantity}` 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Crear la orden
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert([
        {
          user_id: finalUserId,
          total: total,
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Error creando orden:', orderError);
      throw orderError;
    }

    console.log('✅ Orden creada con ID:', order.id);

    // Crear los items de la orden
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      vinyl_id: item.id,
      quantity: item.quantity,
      purchase_price: item.price,
    }));

    const { error: itemsError } = await supabaseServer
      .from('orders_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creando items:', itemsError);
      throw itemsError;
    }

    console.log('✅ Items de orden creados:', orderItems.length);

    // Actualizar stock de cada vinyl
    for (const item of items) {
      // Obtener el stock actual
      const { data: currentVinyl } = await supabaseServer
        .from('vinyls')
        .select('stock')
        .eq('id', item.id)
        .single();

      if (currentVinyl) {
        const newStock = currentVinyl.stock - item.quantity;
        
        // Actualizar el stock
        const { error: stockError } = await supabaseServer
          .from('vinyls')
          .update({ stock: newStock })
          .eq('id', item.id);

        if (stockError) {
          console.error('❌ Error actualizando stock para vinyl', item.id, ':', stockError);
        } else {
          console.log('✅ Stock actualizado para vinyl:', item.id, '- Nuevo stock:', newStock);
        }
      }
    }

    // Limpiar el carrito si el usuario está autenticado
    if (authenticatedUserId) {
      const { error: cartError } = await supabaseServer
        .from('shop_car')
        .delete()
        .eq('user_id', authenticatedUserId);

      if (cartError) {
        console.error('Error limpiando carrito:', cartError);
      } else {
        console.log('✅ Carrito limpiado para usuario:', authenticatedUserId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        message: 'Orden creada exitosamente'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('❌ Error creando orden:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al procesar la orden',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};