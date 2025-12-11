// insert-vinyls.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { vinyls } from './src/data/vinilos.js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'Vinyl_images';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para generar URL de imagen
function getImageUrl(imageName) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${imageName}.webp`;
}

// Función para limpiar precio
function cleanPrice(precioStr) {
  if (typeof precioStr === 'number') return precioStr;
  return parseFloat(precioStr.replace('S/', '').replace(',', '').trim());
}

// Función para transformar un vinyl al formato de la BD
function transformVinyl(vinyl) {
  const precio = typeof vinyl.precio === 'string' 
    ? cleanPrice(vinyl.precio) 
    : parseFloat(vinyl.precio);
    
  const precioReal = typeof vinyl.precio_real === 'string'
    ? parseFloat(vinyl.precio_real)
    : parseFloat(vinyl.precio_real);

  const imageName = vinyl.imagen.split('/').pop().replace('.webp', '');

  return {
    title: vinyl.nombre,
    slug: vinyl.slug,
    artist: vinyl.artista,
    price: precio,
    real_price: precioReal,
    genre: vinyl.genero,
    tracklist: JSON.stringify(vinyl.tracklist),
    img: getImageUrl(imageName),
    type: vinyl.type.trim() === '' ? null : vinyl.type.trim(),
    stock: typeof vinyl.stock === 'string' ? parseInt(vinyl.stock) : vinyl.stock
  };
}

// Función principal de inserción
async function insertVinyls() {
  console.log(`Iniciando inserción de ${vinyls.length} discos...\n`);

  const transformedData = vinyls.map(transformVinyl);
  const batchSize = 50;
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < transformedData.length; i += batchSize) {
    const batch = transformedData.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(transformedData.length / batchSize);

    console.log(`Procesando lote ${batchNumber}/${totalBatches} (${batch.length} discos)...`);

    try {
      const { data, error } = await supabase
        .from('vinyls')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error en lote ${batchNumber}:`, error.message);
        totalErrors += batch.length;
        
        console.log('Intentando insertar individualmente...');
        for (const vinyl of batch) {
          try {
            const { error: singleError } = await supabase
              .from('vinyls')
              .insert([vinyl]);
            
            if (singleError) {
              console.error(`   Error con "${vinyl.title}":`, singleError.message);
            } else {
              console.log(`   "${vinyl.title}" insertado`);
              totalInserted++;
            }
          } catch (err) {
            console.error(`   Error inesperado con "${vinyl.title}":`, err.message);
          }
        }
      } else {
        console.log(`Lote ${batchNumber} insertado exitosamente (${data.length} discos)`);
        totalInserted += data.length;
      }
    } catch (err) {
      console.error(`Error inesperado en lote ${batchNumber}:`, err.message);
      totalErrors += batch.length;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('RESUMEN DE INSERCIÓN');
  console.log('='.repeat(50));
  console.log(`Total de discos: ${vinyls.length}`);
  console.log(`Insertados exitosamente: ${totalInserted}`);
  console.log(`Errores: ${totalErrors}`);
  console.log('='.repeat(50));

  if (totalInserted === vinyls.length) {
    console.log('\nTodos los discos fueron insertados correctamente');
  } else if (totalInserted > 0) {
    console.log('\nAlgunos discos no pudieron insertarse. Revisa los errores arriba.');
  } else {
    console.log('\nNo se pudo insertar ningún disco. Verifica tu configuración.');
  }
}

async function verifyInserts() {
  console.log('\nVerificando datos insertados...\n');

  const { data, error, count } = await supabase
    .from('vinyls')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error al verificar:', error.message);
    return;
  }

  console.log(`Total de discos en la BD: ${count}`);
  
  if (data && data.length > 0) {
    console.log('\nPrimeros 3 discos insertados:');
    data.slice(0, 3).forEach((vinyl, idx) => {
      console.log(`\n${idx + 1}. ${vinyl.title} - ${vinyl.artist}`);
      console.log(`   Precio: S/ ${vinyl.price}`);
      console.log(`   Tipo: ${vinyl.type}`);
      console.log(`   Stock: ${vinyl.stock}`);
    });
  }
}

console.log('Iniciando migración a Supabase...\n');

insertVinyls()
  .then(() => verifyInserts())
  .then(() => {
    console.log('\nProceso completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nError fatal:', err);
    process.exit(1);
  });