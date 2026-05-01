const fs = require('fs');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_KEY');
  process.exit(1);
}

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('__SUPABASE_URL__', url);
html = html.replace('__SUPABASE_KEY__', key);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);

// Copiar imagen del logo
['libelula.png', 'libelula.jpg'].forEach(img => {
  if (fs.existsSync(img)) {
    fs.copyFileSync(img, 'dist/' + img);
    console.log('✅ Logo copiado:', img);
  }
});

console.log('✅ Build completado — claves inyectadas correctamente');
