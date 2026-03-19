import { Injectable, signal } from '@angular/core';
import { StratosTheme, defaultTheme, darkTheme } from './theme.config';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class StratosThemeService {
  private _theme = signal<StratosTheme>(defaultTheme);
  public theme = this._theme.asReadonly();

  private _themeMode = signal<ThemeMode>('system');
  public themeMode = this._themeMode.asReadonly();

  private _isDarkMode = signal<boolean>(false);
  public isDarkMode = this._isDarkMode.asReadonly();

  private readonly THEME_MODE_KEY = 'stratos-theme-mode';
  private readonly BRANDING_STORAGE_KEY = 'stratos-branding';
  private mediaQueryList!: MediaQueryList;

  // Custom branding/login overrides that persist across mode switches
  private _customBranding: Partial<StratosTheme['branding']> | null = null;
  private _customLogin: Partial<StratosTheme['login']> | null = null;

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    // Add initializing class to prevent FOUC (Flash of Unstyled Content)
    document.body.classList.add('theme-initializing');

    // Initialize media query listener for system theme preference
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryList.addEventListener('change', this.onSystemThemeChange.bind(this));

    // Load custom branding overrides (independent of dark/light)
    this.loadBrandingFromStorage();

    // Load theme mode preference from localStorage
    const savedMode = this.loadThemeModeFromStorage();
    this._themeMode.set(savedMode);

    // Apply the theme based on mode (sets correct colors + merges branding)
    this.applyThemeMode(savedMode);
    this.updateBranding(this._theme());

    // Remove initializing class after a small delay to enable transitions
    // This prevents the initial flash while allowing smooth transitions afterward
    setTimeout(() => {
      document.body.classList.remove('theme-initializing');
    }, 100);
  }

  setTheme(theme: Partial<StratosTheme>) {
    const newTheme = { ...this._theme(), ...theme };
    this._theme.set(newTheme);
    this.applyTheme(newTheme);
    this.updateBranding(newTheme);
  }

  getTheme(): StratosTheme {
    return this._theme();
  }

  private applyTheme(theme: StratosTheme) {
    console.log('[StratosThemeService] Applying theme:', theme);
    const root = document.documentElement;

    // Apply brand colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-danger', theme.colors.danger);
    root.style.setProperty('--color-info', theme.colors.info);

    // Apply navigation variables
    root.style.setProperty('--nav-bg', theme.navigation.background);
    root.style.setProperty('--nav-text', theme.navigation.text);
    root.style.setProperty('--nav-text-muted', theme.navigation.textMuted || 'rgba(255, 255, 255, 0.7)');
    root.style.setProperty('--nav-hover', theme.navigation.hover);
    root.style.setProperty('--nav-active', theme.navigation.active);
    root.style.setProperty('--nav-border', theme.navigation.border || 'rgba(255, 255, 255, 0.1)');
    root.style.setProperty('--nav-tooltip', theme.navigation.tooltip || '#374151');

    // Apply layout variables
    root.style.setProperty('--app-bg', theme.layout.background);
    root.style.setProperty('--body-bg', theme.layout.bodyBackground || theme.layout.background);
    root.style.setProperty('--app-text', theme.layout.text);
    root.style.setProperty('--text-muted', theme.layout.textMuted || '#64748b');
    root.style.setProperty('--header-bg', theme.layout.headerBackground);
    root.style.setProperty('--header-text', theme.layout.headerText);
    root.style.setProperty('--header-border', theme.layout.headerBorder || '#e2e8f0');
    root.style.setProperty('--content-bg', theme.layout.contentBackground || '#ffffff');
    root.style.setProperty('--content-secondary', theme.layout.contentSecondary || '#f8fafc');
    root.style.setProperty('--content-border', theme.layout.contentBorder || '#e2e8f0');
    root.style.setProperty('--content-text', theme.layout.text);
    root.style.setProperty('--content-muted', theme.layout.textMuted || '#64748b');

    // Apply branding variables
    root.style.setProperty('--logo-bg', theme.branding.logo);

    // Apply login variables
    root.style.setProperty('--login-bg', theme.login.backgroundColor || theme.layout.background);
    root.style.setProperty('--login-bg-image', `url(${theme.login.backgroundImage || ''})`);
    root.style.setProperty('--login-card-bg', theme.login.cardBackground || '#ffffff');

    // Apply derived component variables inline to avoid CSS load-order race
    const isDark = this._isDarkMode();
    root.style.setProperty('--card-bg', isDark ? '#1e293b' : '#ffffff');
    root.style.setProperty('--card-border', isDark ? '#334155' : '#e5e7eb');
    root.style.setProperty('--card-header-bg', isDark ? '#0f172a' : '#f9fafb');
    root.style.setProperty('--card-shadow', isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)');
    root.style.setProperty('--table-header-bg', isDark ? '#0f172a' : '#f9fafb');
    root.style.setProperty('--table-header-text', isDark ? '#cbd5e1' : '#1e293b');
    root.style.setProperty('--table-row-hover', isDark ? '#334155' : '#f9fafb');
    root.style.setProperty('--table-border', isDark ? '#334155' : '#e5e7eb');
    root.style.setProperty('--input-bg', isDark ? '#1e293b' : '#ffffff');
    root.style.setProperty('--input-border', isDark ? '#475569' : '#d1d5db');
    root.style.setProperty('--input-text', isDark ? '#f1f5f9' : '#1e293b');
    root.style.setProperty('--input-placeholder', isDark ? '#64748b' : '#9ca3af');
    root.style.setProperty('--input-disabled-bg', isDark ? '#0f172a' : '#f3f4f6');
    root.style.setProperty('--shadow-sm', isDark ? '0 1px 2px 0 rgba(0,0,0,0.3)' : '0 1px 2px 0 rgba(0,0,0,0.05)');
    root.style.setProperty('--shadow-md', isDark ? '0 4px 6px -1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.1)');
    root.style.setProperty('--shadow-lg', isDark ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1)');
  }

  private updateBranding(theme: StratosTheme) {
    // Update page title
    document.title = theme.branding.displayName || theme.branding.companyName;

    // Update favicon - use logo if no specific favicon is provided
    const faviconUrl = theme.branding.favicon || theme.branding.logo;
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = faviconUrl;
    } else {
      // Create favicon link if it doesn't exist
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = faviconUrl;
      document.head.appendChild(newFavicon);
    }
  }

  // Company branding methods — these persist across dark/light switches
  setCompanyBranding(branding: Partial<StratosTheme['branding']>) {
    this._customBranding = { ...(this._customBranding || {}), ...branding };
    this.saveBrandingToStorage();
    const currentTheme = this._theme();
    const updatedTheme = {
      ...currentTheme,
      branding: { ...currentTheme.branding, ...branding }
    };
    this.setTheme(updatedTheme);
  }

  setLoginCustomization(login: Partial<StratosTheme['login']>) {
    this._customLogin = { ...(this._customLogin || {}), ...login };
    this.saveBrandingToStorage();
    const currentTheme = this._theme();
    const updatedTheme = {
      ...currentTheme,
      login: { ...currentTheme.login, ...login }
    };
    this.setTheme(updatedTheme);
  }

  setColors(colors: Partial<StratosTheme['colors']>) {
    const currentTheme = this._theme();
    const updatedTheme = {
      ...currentTheme,
      colors: { ...currentTheme.colors, ...colors }
    };
    this.setTheme(updatedTheme);
  }

  // Branding persistence — stored separately from mode so it survives dark/light switches
  private loadBrandingFromStorage() {
    try {
      const saved = localStorage.getItem(this.BRANDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this._customBranding = parsed.branding || null;
        this._customLogin = parsed.login || null;
      }
    } catch (error) {
      // Silently fall back to defaults
    }
  }

  private saveBrandingToStorage() {
    try {
      const data = {
        branding: this._customBranding,
        login: this._customLogin,
      };
      localStorage.setItem(this.BRANDING_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save branding to localStorage');
    }
  }

  // Theme mode management methods
  setThemeMode(mode: ThemeMode) {
    console.log('[StratosThemeService] Setting theme mode to:', mode);
    this._themeMode.set(mode);
    this.saveThemeModeToStorage(mode);
    this.applyThemeMode(mode);
  }

  getThemeMode(): ThemeMode {
    return this._themeMode();
  }

  toggleTheme() {
    const currentMode = this._themeMode();
    // Toggle between light and dark (ignore system for toggle)
    const isDark = this._isDarkMode();
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    this.setThemeMode(newMode);
  }

  private applyThemeMode(mode: ThemeMode) {
    const isDark = this.resolveThemeMode(mode);
    this._isDarkMode.set(isDark);

    // Apply dark class to body for CSS-based theming
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark');
    }

    // Start with the correct base theme for the mode
    const baseTheme = isDark ? darkTheme : defaultTheme;

    // Merge custom branding/login overrides (these persist across mode switches)
    const theme: StratosTheme = {
      ...baseTheme,
      branding: this._customBranding
        ? { ...baseTheme.branding, ...this._customBranding }
        : baseTheme.branding,
      login: this._customLogin
        ? { ...baseTheme.login, ...this._customLogin }
        : baseTheme.login,
    };

    this._theme.set(theme);
    this.applyTheme(theme);
  }

  private resolveThemeMode(mode: ThemeMode): boolean {
    if (mode === 'system') {
      return this.getSystemThemePreference();
    }
    return mode === 'dark';
  }

  private getSystemThemePreference(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private onSystemThemeChange(event: MediaQueryListEvent) {
    console.log('[StratosThemeService] System theme changed to:', event.matches ? 'dark' : 'light');
    // Only update if current mode is 'system'
    if (this._themeMode() === 'system') {
      this.applyThemeMode('system');
    }
  }

  private loadThemeModeFromStorage(): ThemeMode {
    try {
      const saved = localStorage.getItem(this.THEME_MODE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch (error) {
      console.warn('Could not load theme mode from localStorage');
    }
    // Default to light when no preference saved
    return 'light';
  }

  private saveThemeModeToStorage(mode: ThemeMode) {
    try {
      localStorage.setItem(this.THEME_MODE_KEY, mode);
    } catch (error) {
      console.warn('Could not save theme mode to localStorage');
    }
  }

  // Utility methods for components
  getPrimaryColor(): string {
    return this._theme().colors.primary;
  }

  getSecondaryColor(): string {
    return this._theme().colors.secondary;
  }

  getNavBackground(): string {
    return this._theme().navigation.background;
  }

  getBrandingInfo() {
    return this._theme().branding;
  }

  getLoginConfig() {
    return this._theme().login;
  }

  // Reset to default theme
  resetTheme() {
    this._customBranding = null;
    this._customLogin = null;
    localStorage.removeItem(this.BRANDING_STORAGE_KEY);
    this.applyThemeMode(this._themeMode());
  }

  // Export/import theme configuration
  exportTheme(): string {
    return JSON.stringify(this._theme(), null, 2);
  }

  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson);
      this.setTheme(theme);
      return true;
    } catch (error) {
      console.error('Invalid theme JSON', error);
      return false;
    }
  }
}