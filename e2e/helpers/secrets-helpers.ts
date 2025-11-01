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
   * Load secrets from secrets.yaml file
   * Throws error if file doesn't exist or is invalid
   */
  static load() {
    const secretsPath = path.join(process.cwd(), this.SECRETS_FILE);

    if (!fs.existsSync(secretsPath)) {
      throw new Error(
        `Secrets file not found at ${secretsPath}.\n` +
        `Please provide a secrets.yaml file. See src/test-e2e/secrets.yaml.example as reference.`
      );
    }

    try {
      const secrets = yaml.load(fs.readFileSync(secretsPath, 'utf8')) as any;

      return {
        // Console user credentials
        console: {
          admin: {
            username: secrets.consoleUsers?.admin?.username || '',
            password: secrets.consoleUsers?.admin?.password || '',
          },
          user: {
            username: secrets.consoleUsers?.user?.username || '',
            password: secrets.consoleUsers?.user?.password || '',
          },
        },

        // Cloud Foundry configuration
        cloudFoundry: secrets.cloudFoundry || {},

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
