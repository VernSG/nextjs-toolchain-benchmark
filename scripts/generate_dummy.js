const fs = require('fs');
const path = require('path');

console.log('🔍 Detecting project structure...');

// 1. Logika Pencarian Otomatis (Smart Detection)
// Kita cari file page.tsx di beberapa lokasi umum
const possiblePaths = [
    path.join(__dirname, '../app/app/page.tsx'),      // Standard App Router
    path.join(__dirname, '../app/src/app/page.tsx'),  // App Router with src
    path.join(__dirname, '../app/pages/index.tsx'),   // Pages Router
    path.join(__dirname, '../app/page.tsx')           // Root structure
];

const foundPage = possiblePaths.find(p => fs.existsSync(p));

if (!foundPage) {
    console.error("❌ Error: Tidak bisa menemukan file 'page.tsx' atau 'index.tsx'.");
    console.error("   Coba cek apakah folder 'app' ada di sebelah folder 'scripts'?");
    console.error("   Lokasi script saat ini:", __dirname);
    process.exit(1);
}

const PAGE_FILE = foundPage;
const TARGET_DIR = path.join(path.dirname(PAGE_FILE), 'components'); // Folder components ditaruh sebelah page.tsx

console.log(`✅ Target Found: ${PAGE_FILE}`);
console.log(`📂 Creating components in: ${TARGET_DIR}`);

// 2. Buat Folder Components
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

let imports = [];
let tags = [];

console.log('🏗️  Generating 50 Heavy Components...');

// 3. Generate 50 Komponen Berat
for (let i = 1; i <= 50; i++) {
    const componentName = `HeavyComponent${i}`;
    // Simulasi logic berat (Array besar untuk membebani JS Bundle)
    const content = `
    import React from 'react';
    
    // Simulasi beban statis (beban parsing)
    const heavyData = Array.from({ length: 2000 }, (_, i) => "Data item " + i);

    export default function ${componentName}() {
        // Simulasi beban render
        return (
            <div className="p-4 border m-2 bg-gray-50 rounded shadow-sm">
                <h3 className="font-bold text-sm">Component #${i}</h3>
                <p className="text-xs text-gray-500">Loaded {heavyData.length} heavy items</p>
            </div>
        );
    }`;
    
    fs.writeFileSync(path.join(TARGET_DIR, `${componentName}.tsx`), content);
    imports.push(`import ${componentName} from './components/${componentName}';`);
    tags.push(`<div className="w-full"><${componentName} /></div>`);
}

// 4. Inject ke page.tsx (Baca file asli dulu agar import Next/Image tidak hilang jika ada)
const pageContent = `
import React from 'react';
import Image from "next/image"; 
${imports.join('\n')}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <h1 className="text-2xl font-bold mb-8">Scalability Test: 50 Heavy Components</h1>
      <p className="mb-8">This page simulates a medium-scale application structure.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl">
        ${tags.join('\n')}
      </div>
    </main>
  );
}
`;

fs.writeFileSync(PAGE_FILE, pageContent);
console.log('✅ SUCCESS! Project upgraded to MEDIUM scale (50 components injected).'); 