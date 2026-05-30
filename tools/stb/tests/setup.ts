// Unit-test setup: polyfill Web Storage.
//
// Node 22+ ships a native `localStorage` gated behind `--localstorage-file`;
// without that flag it resolves to `undefined`, shadowing the DOM env's
// storage and breaking `localStorage.clear()` in beforeEach hooks. The
// retooled stratos monorepo solves this the same way (see
// src/frontend/vitest.workspace.setup.ts) — override window storage with a
// complete, spec-compliant in-memory implementation.
class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    // Spec-compliant: a missing key returns null (real browsers and node's
    // webstorage do). Returning '' diverged from that and broke `.toBeNull()`
    // assertions once the --localstorage-file flag was dropped.
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: new LocalStorageMock(),
  });
  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: new LocalStorageMock(),
  });
}
