// Minimal ambient declaration for the subset of fs-extra (v11) used by the
// theme builder. fs-extra ships no bundled types and @types/fs-extra is not a
// dependency, so this declares only the functions actually called here with
// their real signatures (rather than silencing the import).
declare module 'fs-extra' {
  export function removeSync(path: string): void;
  export function ensureDir(path: string): Promise<void>;
  export function copySync(src: string, dest: string): void;
  export function writeJsonSync(file: string, object: unknown, options?: { spaces?: number | string }): void;
}
