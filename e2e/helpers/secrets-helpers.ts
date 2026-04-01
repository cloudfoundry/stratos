import { execSync } from 'child_process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * Secrets Helper
 * Loads and provides access to E2E test secrets.
 *
 * Secret sources (checked in order):
 *   1. STRATOS_SECRETS env var — YAML content injected by scripts/secrets.sh run-e2e
 *   2. secrets.<env>.yaml file — when STRATOS_E2E_ENV is set
 *   3. secrets.yaml file — default fallback
 *
 * Profile selection:
 *   STRATOS_E2E_PROFILE selects a named profile within the secrets file.
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
   * Ensure CF endpoint configs have GUIDs resolved.
   * If testOrgGuid/testSpaceGuid are missing but testOrg/testSpace names
   * are present, resolve them via the cf CLI.
   */
  private static resolveEndpointGuids(cfEndpoints: any[]): any[] {
    if (!Array.isArray(cfEndpoints)) return cfEndpoints;

    for (const ep of cfEndpoints) {
      if (ep.testOrg && !ep.testOrgGuid) {
        ep.testOrgGuid = this.resolveCfGuid('org', ep.testOrg);
      }
      if (ep.testSpace && !ep.testSpaceGuid) {
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
   * Auto-detect secrets profile by matching STRATOS_E2E_BASE_URL hostname
   * against profile names. E.g., base URL containing "adepttech" matches
   * the "adepttech" profile.
   */
  private static detectProfileFromUrl(profiles: Record<string, any> | undefined): string | undefined {
    if (!profiles) return undefined;
    const baseUrl = process.env.STRATOS_E2E_BASE_URL;
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
    const env = process.env.STRATOS_E2E_ENV;
    if (env) {
      const envPath = path.join(process.cwd(), `secrets.${env}.yaml`);
      if (fs.existsSync(envPath)) {
        return envPath;
      }
    }
    return path.join(process.cwd(), this.SECRETS_FILE);
  }

  /**
   * Load secrets from env var, env-specific file, or default file.
   * Supports profiles via STRATOS_E2E_PROFILE environment variable.
   * When set, loads from the named profile under the top-level 'profiles' key.
   * Falls back to top-level keys for backwards compatibility.
   */
  static load() {
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
          `  - secrets.<env>.yaml file (with STRATOS_E2E_ENV=<env>)\n` +
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
    const profile = process.env.STRATOS_E2E_PROFILE
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
