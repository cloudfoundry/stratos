/**
 * Vite environment variable type definitions for AnalogJS/Vite builds.
 * This extends the ImportMeta interface to include Vite's env property.
 */

interface ImportMetaEnv {
  /**
   * Vitest test environment flag.
   * Set to true when running in Vitest test context.
   */
  readonly VITEST?: boolean;

  /**
   * Application mode (development, production, test)
   */
  readonly MODE: string;

  /**
   * Base URL for the application
   */
  readonly BASE_URL: string;

  /**
   * Whether the build is in production mode
   */
  readonly PROD: boolean;

  /**
   * Whether the build is in development mode
   */
  readonly DEV: boolean;

  /**
   * Whether server-side rendering is enabled
   */
  readonly SSR: boolean;

  // Allow any additional custom environment variables
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
