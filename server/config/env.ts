import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');

const envFiles = process.env.NODE_ENV === 'production'
  ? ['.env']
  : ['.env.local', '.env'];

for (const envFile of envFiles) {
  const envPath = resolve(projectRoot, envFile);

  if (existsSync(envPath)) {
    config({ path: envPath, override: false, quiet: true });
  }
}
