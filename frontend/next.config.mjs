/**
 * Phase-based config: `next dev` writes to `.next-dev`, while `next build`/`next start`
 * use `.next`. This keeps a running dev server from being corrupted by a production
 * build (and vice-versa) — they no longer share a build directory.
 *
 * `"phase-development-server"` is the value of Next's PHASE_DEVELOPMENT_SERVER constant
 * (inlined to avoid an ESM import of next/constants in this .mjs config).
 *
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default (phase) => ({
  reactStrictMode: true,
  distDir: phase === "phase-development-server" ? ".next-dev" : ".next",
});
