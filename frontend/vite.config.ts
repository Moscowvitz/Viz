import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getRootEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  const candidateFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../.env'),
  ]
  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        for (const line of content.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx > 0) {
            const k = trimmed.slice(0, eqIdx).trim()
            let v = trimmed.slice(eqIdx + 1).trim()
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1)
            }
            env[k] = v
          }
        }
      } catch (e) {}
    }
  }
  return env
}

function pickValidUrl(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    if (v && !v.includes('your_supabase_') && v.startsWith('http')) {
      return v
    }
  }
  return ''
}

function pickValidKey(...vals: (string | undefined)[]): string {
  for (const v of vals) {
    if (v && !v.includes('your_supabase_') && v.length > 20) {
      return v
    }
  }
  return ''
}

const rootEnv = getRootEnv()
const supabaseUrl = pickValidUrl(
  rootEnv.VITE_SUPABASE_URL,
  rootEnv.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_URL
)
const supabaseAnonKey = pickValidKey(
  rootEnv.VITE_SUPABASE_ANON_KEY,
  rootEnv.SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
  process.env.SUPABASE_ANON_KEY
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
  },
})

