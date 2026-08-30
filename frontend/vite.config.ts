import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

/**
 * Inject a strict Content-Security-Policy into the built index.html.
 * Build-only: the dev server needs inline/eval for HMR, so it is left alone.
 * The inline theme-bootstrap script is allow-listed by its sha256 hash rather
 * than by opening up `script-src` to `'unsafe-inline'`.
 */
function cspPlugin(): Plugin {
  return {
    name: 'html-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
      const hashes = inlineScripts.map(
        (m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`,
      )
      // NOTE: `frame-ancestors`, `report-uri` and `sandbox` are ignored in a
      // <meta> CSP — clickjacking protection must be added as a real response
      // header at the server/CDN (`Content-Security-Policy: frame-ancestors
      // 'none'` or `X-Frame-Options: DENY`).
      const csp = [
        "default-src 'self'",
        `script-src 'self' ${hashes.join(' ')}`.trim(),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        "connect-src 'self' http://localhost:8000",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; ')
      return html.replace(
        '</title>',
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cspPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
