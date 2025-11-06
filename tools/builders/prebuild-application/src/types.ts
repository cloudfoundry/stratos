import { PrebuildScript } from './schema';

export interface ScriptExecution {
  script: PrebuildScript;
  output: string;
  exitCode: number;
  duration: number;
  cached: boolean;
  error?: Error;
}

export interface CacheEntry {
  checksums: Record<string, string>;
  timestamp: number;
  output?: string;
}

export interface PrebuildResult {
  success: boolean;
  executions: ScriptExecution[];
  totalDuration: number;
  cacheHits: number;
  cacheMisses: number;
}
