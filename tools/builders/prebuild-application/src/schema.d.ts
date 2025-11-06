export interface PrebuildApplicationBuilderSchema {
  browserTarget: string;
  prebuildScripts?: PrebuildScript[];
  skipPrebuild?: boolean;
  clearCache?: boolean;
  verbose?: boolean;
}

export interface PrebuildScript {
  name: string;
  script: string;
  phase?: number;
  cache?: boolean;
  cacheKey?: string[];
  timeout?: number;
  required?: boolean;
}
