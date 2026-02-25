import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { PrebuildScript } from './schema';
import { CacheEntry } from './types';

export class CacheManager {
  private cacheDir: string;

  constructor(
    private workspaceRoot: string,
    clearCache: boolean = false
  ) {
    this.cacheDir = join(workspaceRoot, 'node_modules', '.cache', 'stratos-builder');

    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }

    if (clearCache) {
      this.clearAll();
    }
  }

  async get(script: PrebuildScript): Promise<CacheEntry | null> {
    const cacheFile = this.getCacheFile(script);

    if (!existsSync(cacheFile)) {
      return null;
    }

    try {
      const cached: CacheEntry = JSON.parse(readFileSync(cacheFile, 'utf-8'));

      // Validate cache
      const currentChecksums = await this.computeChecksums(script);

      // Compare checksums
      for (const [file, checksum] of Object.entries(currentChecksums)) {
        if (cached.checksums[file] !== checksum) {
          return null; // Cache invalid
        }
      }

      return cached;
    } catch (error) {
      return null; // Invalid cache file
    }
  }

  async set(script: PrebuildScript, output: string): Promise<void> {
    const cacheFile = this.getCacheFile(script);
    const checksums = await this.computeChecksums(script);

    const entry: CacheEntry = {
      checksums,
      timestamp: Date.now(),
      output
    };

    writeFileSync(cacheFile, JSON.stringify(entry, null, 2));
  }

  private async computeChecksums(script: PrebuildScript): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {};

    if (!script.cacheKey || script.cacheKey.length === 0) {
      return checksums;
    }

    for (const pattern of script.cacheKey) {
      const files = await glob(pattern, {
        cwd: this.workspaceRoot,
        absolute: true,
        nodir: true
      });

      for (const file of files) {
        if (existsSync(file)) {
          const content = readFileSync(file);
          checksums[file] = this.hash(content);
        }
      }
    }

    return checksums;
  }

  private hash(content: Buffer | string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private getCacheFile(script: PrebuildScript): string {
    const scriptHash = this.hash(script.script);
    return join(this.cacheDir, `${scriptHash}.json`);
  }

  private clearAll(): void {
    try {
      const files = readdirSync(this.cacheDir);

      for (const file of files) {
        unlinkSync(join(this.cacheDir, file));
      }
    } catch (error) {
      // Directory doesn't exist or empty
    }
  }
}
