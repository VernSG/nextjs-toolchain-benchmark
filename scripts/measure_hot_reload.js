const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; 
const runId = process.argv[3];
const npmCommand = mode === 'turbo' ? 'dev:turbo' : 'dev:legacy';

// Cari file page.tsx
let filePath = path.join(__dirname, '../app/app/page.tsx'); 
if (!fs.existsSync(filePath)) filePath = path.join(__dirname, '../app/page.tsx');
if (!fs.existsSync(filePath)) filePath = path.join(__dirname, '../app/src/app/page.tsx');

if (!fs.existsSync(filePath)) {
    console.error('❌ Error: Tidak bisa menemukan page.tsx');
    process.exit(1);
}

console.log(`[${mode.toUpperCase()}] Run ${runId}: Measuring Hot Reload...`);
console.log(` -> Target File: ${filePath}`);

const originalContent = fs.readFileSync(filePath, 'utf8');

function restoreFile() {
    fs.writeFileSync(filePath, originalContent);
}

const server = spawn('npm', ['run', npmCommand], {
    cwd: './app',
    shell: true,
    detached: true
});

let isServerReady = false;
let hotReloadStartTime = null;

server.stdout.on('data', (data) => {
    const output = data.toString();
    
    // DEBUG: Uncomment baris bawah ini jika masih error untuk lihat log asli
    // console.log('[SERVER LOG]', output); 

    // 1. TUNGGU READY
    if (!isServerReady && output.match(/Ready in/i)) {
        isServerReady = true;
        console.log(' -> Server Ready. Warming up (fetching page)...');
        
        // TRIK RAHASIA: Pancing server agar "bangun"
        // Kita fetch halaman utama agar Next.js sadar ada "pengguna"
        fetch('http://localhost:3000')
            .then(() => {
                console.log(' -> Page fetched. Waiting for stability...');
                // Tunggu 3 detik setelah fetch agar kompilasi awal selesai
                setTimeout(triggerHotReload, 3000);
            })
            .catch(err => {
                console.error(' -> Fetch failed:', err.message);
                // Tetap coba lanjut siapa tahu bisa
                setTimeout(triggerHotReload, 3000);
            });
    }

    // 3. DETEKSI KOMPILASI (HMR)
    if (isServerReady && hotReloadStartTime) {
        // Regex diperluas untuk menangkap variasi log Next.js
        // Menangkap: "Compiled /page in 100ms" atau "Compiled in 100ms"
        const match = output.match(/Compiled.*in ([0-9]+)ms/i);
        
        if (match) {
            const duration = parseInt(match[1]);
            const realDuration = Date.now() - hotReloadStartTime;
            
            // Kita ambil max antara log nextjs vs waktu real (karena log kadang delay)
            // Tapi untuk konsistensi, kita percaya log Next.js dulu
            console.log(` -> HMR Detected: ${duration} ms`);
            
            cleanupAndExit(0);
        }
    }
});

function triggerHotReload() {
    console.log(' -> Triggering File Change...');
    const timestamp = Date.now();
    // Tambah komentar di atas file agar aman
    const newContent = `// Hot Reload Test ${timestamp}\n` + originalContent;
    
    hotReloadStartTime = Date.now();
    fs.writeFileSync(filePath, newContent);
}

function cleanupAndExit(code) {
    try { process.kill(-server.pid); } catch(e) { server.kill(); }
    restoreFile();
    process.exit(code);
}

// Timeout 30 detik
setTimeout(() => {
    console.error('Timeout: HMR did not happen within 30s');
    cleanupAndExit(1);
}, 30000);