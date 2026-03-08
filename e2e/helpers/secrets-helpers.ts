import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * Secrets Helper
 * Migrated from Protractor secrets management
 * Loads and provides access to E2E test secrets from secrets.yaml
 *
 * Secrets are resolved in priority order:
 *   1. STRATOS_SECRETS env var (raw YAML content — never touches disk)
 *   2. secrets.yaml file on disk (legacy fallback)
 */
export class SecretsHelper {
  private static SECRETS_FILE = 'secrets.yaml';

  /**
   * Load secrets from env var or secrets.yaml file
   * Priority: STRATOS_SECRETS env var > secrets.yaml file
   * Throws error if neither source is available
   */
  static load() {
    const envSecrets = process.env.STRATOS_SECRETS;
    if (envSecrets) {
      return SecretsHelper.parse(envSecrets);
    }

    const secretsPath = path.join(process.cwd(), this.SECRETS_FILE);

    if (!fs.existsSync(secretsPath)) {
      throw new Error(
        'No secrets found. Set STRATOS_SECRETS env var or provide secrets.yaml.\n' +
        'See e2e/secrets.yaml.template for the expected format.'
      );
    }

    return SecretsHelper.parse(
      fs.readFileSync(secretsPath, 'utf8')
    );
  }

  private static parse(content: string) {
    try {
      const secrets = yaml.load(content) as any;

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
        // Support both 'cloudFoundry' (root level) and 'endpoints.cf' (nested) formats
        cloudFoundry: secrets.cloudFoundry || secrets.endpoints?.cf || [],

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
      throw new Error(`Invalid secrets configuration: ${e}`);
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
