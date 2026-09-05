const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Load environment files if present
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn('[StoryEngine] Could not read env file:', filePath, err.message);
  }
}

['.env', '.env.local', 'backend/.env', 'frontend/.env'].forEach((f) => {
  loadEnvFile(path.join(__dirname, f));
});

const isRealSupabase = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_URL.includes('your_supabase_') &&
  process.env.SUPABASE_URL.startsWith('http')
);

if (isRealSupabase) {
  console.log('[StoryEngine] 🟢 Connecting to Real Supabase:', process.env.SUPABASE_URL);
} else {
  console.log('[StoryEngine] 🟡 Supabase credentials not set or placeholder. Running in-memory mock database mode.');
}

const backendDist = path.join(__dirname, 'backend', 'dist', 'main.js');
const frontendDist = path.join(__dirname, 'frontend', 'dist', 'index.html');

if (!fs.existsSync(backendDist) || !fs.existsSync(frontendDist)) {
  console.log('[StoryEngine] Build artifacts missing. Building backend and frontend...');
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('[StoryEngine] Starting server at http://0.0.0.0:3000...');
require('./backend/dist/main.js');
