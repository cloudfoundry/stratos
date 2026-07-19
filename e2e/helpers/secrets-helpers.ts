import { execSync } from 'child_process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { CF_GUIDS_FILE } from '../auth.constants';

/**
 * Capability flags declared by a secrets profile.
 *
 * Keys name an environment-dependent feature (e.g. `autoscaler`, `sso`,
 * `metrics`); values are `true` only when that feature is genuinely
 * present and exercisable in the target environment. No secret values
 * belong here — names and booleans only.
 *
 * A capability that is absent from the map, or a map that is absent
 * entirely, both mean "unknown" — never treated as available. See
 * `requireCapability()` in `test-utils.ts`, which skips rather than
 * guessing from the DOM.
 */
export interface SecretsCapabilities {
  [name: string]: boolean;
}

/**
 * Secrets Helper
 * Loads and provides access to E2E test secrets.
 *
 * Secret sources (checked in order):
 *   1. STRATOS_SECRETS env var — YAML content injected by scripts/secrets.sh run-e2e
 *   2. secrets.<env>.yaml file — when E2E_ENV is set
 *   3. secrets.yaml file — default fallback
 *
 * Profile selection:
 *   E2E_PROFILE selects a named profile within the secrets file.
 */
export class SecretsHelper {
  private static SECRETS_FILE = 'secrets.yaml';

  /**
   * Resolve a CF org or space GUID using the cf CLI.
   * Returns the GUID string or empty string on failure.
   */
  private static resolveCfGuid(type: 'org' | 'space', name: string): string {
    try {
      const cmd = type === 'org'
        ? `cf org "${name}" --guid`
        : `cf space "${name}" --guid`;
      return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
    } catch {
      return '';
    }
  }

  /**
   * Read GUIDs persisted by auth.setup.ts (see CF_GUIDS_FILE), if present.
   * Returns null when the file is missing or unparsable. The result may
   * carry a `__meta` key (profile/apiUrl/writtenAt) alongside the
   * per-endpoint entries — see warnIfGuidsStale().
   */
  private static loadPersistedGuids(): Record<string, any> | null {
    const guidsPath = path.join(process.cwd(), CF_GUIDS_FILE);
    if (!fs.existsSync(guidsPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(guidsPath, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Warn loudly — but never fail — when the persisted GUIDs file looks
   * stale: written before this run started (E2E_RUN_START predates
   * `__meta.writtenAt`), or stamped for a different profile/API endpoint
   * than the one active now. Stays fail-open (GUIDs are consumed either
   * way): a stale-but-still-valid entry is far more common than a
   * genuinely poisoned one, and this file's whole purpose is avoiding
   * the slow/racy cf CLI fallback below. A file with no `__meta` (older
   * format) is treated as unknown, not stale — silently accepted.
   */
  private static warnIfGuidsStale(persisted: Record<string, any> | null, activeApiUrl: string | undefined): void {
    const meta = persisted?.__meta;
    if (!meta) return;

    const runStart = Number(process.env.E2E_RUN_START);
    const reasons: string[] = [];

    if (runStart && meta.writtenAt && meta.writtenAt < runStart) {
      reasons.push(`written at ${new Date(meta.writtenAt).toISOString()}, before this run started`);
    }
    if (process.env.E2E_PROFILE && meta.profile && meta.profile !== process.env.E2E_PROFILE) {
      reasons.push(`written for profile '${meta.profile}', active profile is '${process.env.E2E_PROFILE}'`);
    }
    if (activeApiUrl && meta.apiUrl && meta.apiUrl !== activeApiUrl) {
      reasons.push(`written for API '${meta.apiUrl}', active API is '${activeApiUrl}'`);
    }

    if (reasons.length > 0) {
      console.warn(
        `[SecretsHelper] STALE ${CF_GUIDS_FILE}: ${reasons.join('; ')} — consuming it anyway. ` +
        `GUIDs may point at a deleted org/space or a different run. ` +
        `Re-run 'npx playwright test --project=setup' to refresh.`
      );
    }
  }

  /**
   * Ensure CF endpoint configs have GUIDs resolved.
   * File-first: GUIDs persisted by auth.setup.ts (CF_GUIDS_FILE) are used
   * when available. Only when that file is missing or lacks an entry for
   * an endpoint do we fall back to the cf CLI — slow (execSync, 10s
   * timeout per call) and unsafe under parallel workers (cf target
   * mutates the shared ~/.cf/config.json), so a loud warning is logged.
   */
  private static resolveEndpointGuids(cfEndpoints: any[]): any[] {
    if (!Array.isArray(cfEndpoints)) return cfEndpoints;

    const persisted = this.loadPersistedGuids();
    this.warnIfGuidsStale(persisted, cfEndpoints[0]?.url);

    for (const ep of cfEndpoints) {
      const fromFile = persisted?.[ep.name];
      if (fromFile?.orgGuid && fromFile?.spaceGuid) {
        ep.testOrgGuid = ep.testOrgGuid || fromFile.orgGuid;
        ep.testSpaceGuid = ep.testSpaceGuid || fromFile.spaceGuid;
        continue;
      }

      const needsOrgGuid = ep.testOrg && !ep.testOrgGuid;
      const needsSpaceGuid = ep.testSpace && !ep.testSpaceGuid;
      if (needsOrgGuid || needsSpaceGuid) {
        console.warn(
          `[SecretsHelper] No persisted GUIDs for endpoint '${ep.name}' in ${CF_GUIDS_FILE} — ` +
          `falling back to cf CLI resolution. Run 'npx playwright test --project=setup' first to avoid this.`
        );
      }

      // Fallback: resolve via cf CLI
      if (needsOrgGuid) {
        ep.testOrgGuid = this.resolveCfGuid('org', ep.testOrg);
      }
      if (needsSpaceGuid) {
        // Target the org first so cf space --guid works
        if (ep.testOrg) {
          try {
            execSync(`cf target -o "${ep.testOrg}" > /dev/null 2>&1`, { timeout: 10000 });
          } catch { /* best effort */ }
        }
        ep.testSpaceGuid = this.resolveCfGuid('space', ep.testSpace);
      }
    }
    return cfEndpoints;
  }

  /**
   * Auto-detect secrets profile by matching E2E_BASE_URL hostname
   * against profile names. E.g., base URL containing "adepttech" matches
   * the "adepttech" profile.
   */
  private static detectProfileFromUrl(profiles: Record<string, any> | undefined): string | undefined {
    if (!profiles) return undefined;
    const baseUrl = process.env.E2E_BASE_URL;
    if (!baseUrl) return undefined;
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    for (const name of Object.keys(profiles)) {
      if (name !== 'local' && hostname.includes(name.toLowerCase())) {
        return name;
      }
    }
    return undefined;
  }

  /**
   * Parse raw YAML content into the secrets object.
   */
  private static parse(content: string): any {
    return yaml.load(content) as any;
  }

  /**
   * Resolve the secrets file path, checking env-specific file first.
   */
  private static resolveSecretsPath(): string {
    const env = process.env.E2E_ENV;
    if (env) {
      const envPath = path.join(process.cwd(), `secrets.${env}.yaml`);
      if (fs.existsSync(envPath)) {
        return envPath;
      }
    }
    return path.join(process.cwd(), this.SECRETS_FILE);
  }

  /** Memoized result of loadUncached() — parsed once per process. */
  private static _cache: any;

  /**
   * Load secrets from env var, env-specific file, or default file.
   * Supports profiles via E2E_PROFILE environment variable.
   * When set, loads from the named profile under the top-level 'profiles' key.
   * Falls back to top-level keys for backwards compatibility.
   *
   * Memoized: the underlying YAML parse and GUID resolution only run once
   * per process — E2E_PROFILE/STRATOS_SECRETS don't change mid-process, and
   * this was previously being re-run (with a cf CLI re-shell) up to 8x per
   * test.
   */
  static load() {
    if (!this._cache) {
      this._cache = this.loadUncached();
    }
    return this._cache;
  }

  private static loadUncached() {
    let raw: any;

    // Source 1: STRATOS_SECRETS env var (injected by scripts/secrets.sh run-e2e)
    const envSecrets = process.env.STRATOS_SECRETS;
    if (envSecrets) {
      try {
        raw = this.parse(envSecrets);
      } catch (e) {
        throw new Error(`Failed to parse STRATOS_SECRETS env var: ${e}`);
      }
    } else {
      // Source 2/3: env-specific file or default file
      const secretsPath = this.resolveSecretsPath();
      if (!fs.existsSync(secretsPath)) {
        throw new Error(
          `Secrets file not found at ${secretsPath}.\n` +
          `Provide secrets via:\n` +
          `  - STRATOS_SECRETS env var (from scripts/secrets.sh run-e2e)\n` +
          `  - secrets.<env>.yaml file (with E2E_ENV=<env>)\n` +
          `  - secrets.yaml file\n` +
          `See e2e/secrets.yaml.template for reference.`
        );
      }
      try {
        raw = this.parse(fs.readFileSync(secretsPath, 'utf8'));
      } catch (e) {
        throw new Error(`Failed to parse ${secretsPath}: ${e}`);
      }
    }

    // Auto-detect profile from base URL if not explicitly set
    const profile = process.env.E2E_PROFILE
      || this.detectProfileFromUrl(raw.profiles);

    let secrets: any;
    if (profile && raw.profiles?.[profile]) {
      secrets = { ...raw, ...raw.profiles[profile] };
    } else if (profile) {
      throw new Error(
        `Profile '${profile}' not found in secrets. ` +
        `Available: ${Object.keys(raw.profiles || {}).join(', ')}`
      );
    } else {
      secrets = raw;
    }

    // Get CF endpoints and resolve any missing GUIDs from names
    const cfEndpoints = secrets.cloudFoundry || secrets.endpoints?.cf || [];
    this.resolveEndpointGuids(cfEndpoints);

    return {
      console: {
        admin: {
          username: secrets.consoleUsers?.admin?.username || '',
          password: secrets.consoleUsers?.admin?.password || '',
        },
        user: {
          username: secrets.consoleUsers?.user?.username || secrets.consoleUsers?.nonAdmin?.username || '',
          password: secrets.consoleUsers?.user?.password || secrets.consoleUsers?.nonAdmin?.password || '',
        },
      },
      cloudFoundry: cfEndpoints,
      github: {
        apiUrl: secrets.stratosGitHubApiUrl || 'https://api.github.com',
      },
      headless: secrets.headless || false,
      capabilities: (secrets.capabilities || {}) as SecretsCapabilities,
      raw: secrets,

      /** Get a Cloud Foundry endpoint config by index */
      getCloudfoundryEndpoint(index: number) {
        return cfEndpoints[index] || null;
      },

      /** Get the full merged config (profile + top-level) */
      getConfig() {
        return secrets;
      },
    };
  }

  /**
   * Get console admin username
   */
  static getConsoleAdminUsername(): string {
    return this.load().console.admin.username;
  }

  /**
   * Get console admin password
   */
  static getConsoleAdminPassword(): string {
    return this.load().console.admin.password;
  }

  /**
   * Get console user username
   */
  static getConsoleUserUsername(): string {
    return this.load().console.user.username;
  }

  /**
   * Get console user password
   */
  static getConsoleUserPassword(): string {
    return this.load().console.user.password;
  }
}
