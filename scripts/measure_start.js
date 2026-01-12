const { spawn } = require('child_process');

const mode = process.argv[2]; // 'legacy' atau 'turbo'
const runId = process.argv[3];

// Mapping mode ke npm script
const npmCommand = mode === 'turbo' ? 'dev:turbo' : 'dev:legacy';

console.log(`[${mode.toUpperCase()}] Run ${runId}: Measuring Cold Start...`);

// Spawn process dengan DETACHED: TRUE agar punya Process Group ID (PGID) sendiri
const server = spawn('npm', ['run', npmCommand], {
  cwd: './app',
  shell: true,
  detached: true 
});

let coldStartTime = null;

server.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Regex mencari angka "Ready in XXXms" atau "Ready in X.Xs"
  // Kita handle format "15.8s" (detik) dan "640ms" (milidetik)
  const matchMs = output.match(/Ready in ([0-9]+)ms/i);
  const matchS = output.match(/Ready in ([0-9]+(\.[0-9]+)?)s/i);
  
  if (matchMs || matchS) {
    if (matchMs) {
        coldStartTime = parseInt(matchMs[1]);
    } else {
        // Kalau formatnya detik (misal 15.8s), kali 1000
        coldStartTime = parseFloat(matchS[1]) * 1000;
    }

    console.log(` -> Ready detected: ${coldStartTime} ms`);
    
    // KILL PROCESS GROUP
    // Karena detached: true, kita bisa pakai minus pid (-pid)
    try {
        process.kill(-server.pid);
    } catch (e) {
        // Fallback jika group kill gagal, coba kill biasa
        server.kill();
    }
    process.exit(0);
  }
});

// Timeout safety 60s
setTimeout(() => {
  if (!coldStartTime) {
    console.error('Timeout waiting for server ready');
    // Matikan paksa jika timeout
    try {
        process.kill(-server.pid);
    } catch (e) {
        server.kill();
    }
    process.exit(1);
  }
}, 60000);