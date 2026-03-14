import { execSync } from 'child_process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * Secrets Helper
 * Migrated from Protractor secrets management
 * Loads and provides access to E2E test secrets from secrets.yaml
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
   * Load secrets from secrets.yaml file
   * Supports profiles via STRATOS_E2E_PROFILE environment variable.
   * When set, loads from the named profile under the top-level 'profiles' key.
   * Falls back to top-level keys for backwards compatibility.
   */
  static load() {
    const secretsPath = path.join(process.cwd(), this.SECRETS_FILE);

    if (!fs.existsSync(secretsPath)) {
      throw new Error(
        `Secrets file not found at ${secretsPath}.\n` +
        `Please provide a secrets.yaml file. See e2e/secrets.yaml.example as reference.`
      );
    }

    try {
      const raw = yaml.load(fs.readFileSync(secretsPath, 'utf8')) as any;
      const profile = process.env.STRATOS_E2E_PROFILE;

      let secrets: any;
      if (profile && raw.profiles?.[profile]) {
        secrets = { ...raw, ...raw.profiles[profile] };
      } else if (profile) {
        throw new Error(`Profile '${profile}' not found in secrets.yaml. Available: ${Object.keys(raw.profiles || {}).join(', ')}`);
      } else {
        secrets = raw;
      }

      // Get CF endpoints and resolve any missing GUIDs from names
      const cfEndpoints = secrets.cloudFoundry || secrets.endpoints?.cf || [];
      this.resolveEndpointGuids(cfEndpoints);

      return {
        // Console user credentials
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

        // Cloud Foundry configuration
        cloudFoundry: cfEndpoints,

        // GitHub configuration
        github: {
          apiUrl: secrets.stratosGitHubApiUrl || 'https://api.github.com',
        },

        // Headless mode
        headless: secrets.headless || false,

        // All raw secrets (for compatibility)
        raw: secrets,
      };
    } catch (e) {
      throw new Error(`Invalid secrets.yaml configuration file: ${e}`);
    }
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
