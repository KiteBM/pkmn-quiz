import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_DEX_ID } from '../src/utils/generations.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'cries');

mkdirSync(OUTPUT_DIR, { recursive: true });

async function fetchCry(id: number): Promise<void> {
  const outPath = join(OUTPUT_DIR, `${id}.ogg`);
  if (existsSync(outPath)) return;

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} for cry ${id}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(outPath, buffer);
      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
  }
}

async function main() {
  const ids = Array.from({ length: MAX_DEX_ID }, (_, i) => i + 1);
  const batchSize = 10;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(batch.map(fetchCry));
    process.stdout.write(`\rDownloaded ${Math.min(i + batchSize, ids.length)}/${ids.length}`);
    if (i + batchSize < ids.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  process.stdout.write('\n');
  console.log(`Cries saved to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
