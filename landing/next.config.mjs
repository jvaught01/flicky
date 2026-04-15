import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static-export friendly: the landing is pure content, so nothing
  // here needs a server. Deploy anywhere that serves static files.
  output: 'export',
  images: { unoptimized: true },
  // Pin Turbopack's root to this folder so Next 16 doesn't wander up
  // the tree and pick up the outer Electron app's lockfile.
  turbopack: { root: __dirname },
};

export default nextConfig;
