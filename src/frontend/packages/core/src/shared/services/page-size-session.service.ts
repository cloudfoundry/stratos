import { Injectable } from '@angular/core';

/**
 * Remembers page size selections within the current browser session.
 *
 * Logic:
 *   1. User explicitly picks a page size on a screen → stored for that screen
 *   2. User navigates to a screen with no explicit choice → inherits the
 *      last value they explicitly set on any screen
 *   3. No explicit choice made yet this session → returns undefined (caller
 *      uses the compiled default)
 *
 * Session-only (in memory) — no persistence across page reloads.
 * Future: FWT-805 will persist to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class PageSizeSessionService {
  /** Explicit per-screen choices */
  private screens = new Map<string, number>();

  /** Last value explicitly set by the user on any screen */
  private lastExplicit: number | undefined;

  /**
   * Get the page size for a screen.
   * Returns the explicit choice for this screen, or the last explicit
   * choice from any screen, or undefined if no choice has been made.
   */
  get(screenKey: string): number | undefined {
    return this.screens.get(screenKey) ?? this.lastExplicit;
  }

  /**
   * Record an explicit user choice for a screen.
   */
  set(screenKey: string, size: number): void {
    this.screens.set(screenKey, size);
    this.lastExplicit = size;
  }

  /**
   * Check if the user has explicitly set a value for this screen.
   */
  hasExplicit(screenKey: string): boolean {
    return this.screens.has(screenKey);
  }
}
