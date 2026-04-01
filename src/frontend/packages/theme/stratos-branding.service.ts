import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StratosTheme, defaultTheme, darkTheme } from './theme.config';
import { CompanyConfig } from './company-config.interface';
import { BUILD_INFO } from '../core/src/environments/build-info';

export type ThemeMode = 'light' | 'dark' | 'system';

const APP_VERSION_KEY = 'stratos-app-version';
const NON_USER_KEYS = ['stratos-theme-mode', 'stratos-branding', 'stratos-company-config', 'stratos-show-all-menu-items'];

// Default company configuration — Tailwind colors matching defaultTheme
const defaultCompanyConfig: CompanyConfig = {
  company: {
    name: 'Stratos',
    website: 'https://stratos.app',
    supportEmail: 'support@stratos.app',
  },
  logos: {
    main: '/core/assets/logo.png',
    navigation: '/core/assets/logo.png',
    navigationIcon: '/core/assets/logo.png',
    favicon: '/favicon.ico',
    loginBackground: '/core/assets/login-bg.jpg',
  },
  theme: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#60a5fa',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  navigation: {
    background: '#1e293b',
    text: '#ffffff',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.15)',
  },
  layout: {
    background: '#f8fafc',
    text: '#1e293b',
    headerBackground: '#ffffff',
    headerText: '#1e293b',
  },
  login: {
    title: 'Stratos Console',
    subtitle: 'Multi-Cloud Management Platform',
    showLogo: true,
    showTitle: true,
    backgroundColor: '#f5f5f5',
    cardBackground: '#ffffff',
  },
  footer: {
    copyright: 'Stratos',
  },
  defaults: {
    themeMode: 'light',
    sidebarOpen: true,
    sidebarPinned: true,
    pollingEnabled: true,
    sessionTimeout: true,
    gravatarEnabled: true,
    pageSize: 9,
    viewMode: 'cards',
  },
};

@Injectable({
  providedIn: 'root'
})
export class StratosBrandingService {
  private http = inject(HttpClient);

  // --- Theme signals ---
  private _theme = signal<StratosTheme>(defaultTheme);
  public theme = this._theme.asReadonly();

  private _themeMode = signal<ThemeMode>('light');
  public themeMode = this._themeMode.asReadonly();

  private _isDarkMode = signal<boolean>(false);
  public isDarkMode = this._isDarkMode.asReadonly();

  // --- Config signal ---
  private _config = signal<CompanyConfig>(defaultCompanyConfig);
  public config = this._config.asReadonly();

  // --- User preferences activation ---
  private _userPrefsActive = signal<boolean>(false);
  public userPrefsActive = this._userPrefsActive.asReadonly();

  // --- Storage keys ---
  private readonly THEME_MODE_KEY = 'stratos-theme-mode';
  private readonly BRANDING_STORAGE_KEY = 'stratos-branding';
  private readonly CONFIG_STORAGE_KEY = 'stratos-company-config';

  // --- Media query ---
  private mediaQueryList!: MediaQueryList;

  // Custom branding/login overrides that persist across mode switches
  private _customBranding: Partial<StratosTheme['branding']> | null = null;
  private _customLogin: Partial<StratosTheme['login']> | null = null;

  constructor() {
    // Layer 1+2 only — no user preferences loaded here
    this.initializeBranding();
  }

  /**
   * Constructor initialization: Layers 1 (config defaults) and 2 (login appearance).
   * Theme mode is NOT loaded from storage — that requires activateUserPreferences().
   */
  private initializeBranding() {
    // FOUC prevention
    document.body.classList.add('theme-initializing');

    // Check app version — clear stale preferences on version change
    this.checkAppVersion();

    // Initialize media query listener for system theme preference
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryList.addEventListener('change', this.onSystemThemeChange.bind(this));

    // Apply config layer CSS vars using defaultTheme (Layer 1)
    this.applyTheme(defaultTheme);
    this.updateBranding(defaultTheme);

    // Start async company config load (Layer 1 update)
    this.loadCompanyConfig();

    // Remove initializing class after a small delay to enable transitions
    setTimeout(() => {
      document.body.classList.remove('theme-initializing');
    }, 100);
  }

  // =========================================================================
  // Layer 3: User Preferences — called post-auth
  // =========================================================================

  /**
   * Activate user preferences (Layer 3). Called after authentication.
   * Loads theme mode from storage or falls back to config defaults.
   */
  activateUserPreferences() {
    if (this._userPrefsActive()) return;
    this._userPrefsActive.set(true);
    this.loadBrandingFromStorage();
    const savedMode = this.loadThemeModeFromStorage();
    const mode = savedMode || this._config().defaults?.themeMode || 'light';
    this._themeMode.set(mode as ThemeMode);
    this.applyThemeMode(mode as ThemeMode);
  }

  // =========================================================================
  // Layer 4: Page Preference Defaults
  // =========================================================================

  getDefaultPageSize(): number {
    return this._config().defaults?.pageSize ?? 9;
  }

  getDefaultViewMode(): 'table' | 'cards' {
    return (this._config().defaults?.viewMode as 'table' | 'cards') ?? 'cards';
  }

  getDefaultSortDirection(): 'asc' | 'desc' {
    return (this._config().defaults?.sortDirection as 'asc' | 'desc') ?? 'asc';
  }

  getDefaultSidebarOpen(): boolean {
    return this._config().defaults?.sidebarOpen ?? true;
  }

  getDefaultPollingEnabled(): boolean {
    return this._config().defaults?.pollingEnabled ?? true;
  }

  // =========================================================================
  // Company Config Loading (from CompanyConfigService)
  // =========================================================================

  private async loadCompanyConfig() {
    try {
      // Try to load from company-config.json first
      const config = await this.http.get<CompanyConfig>('/assets/company-config.json').toPromise();
      if (config) {
        this.setCompanyConfig(config);
        return;
      }
    } catch (error) {
      console.warn('Could not load company-config.json, trying environment-specific config');
    }

    try {
      // Try to load from environment-specific config
      const envConfig = await this.http.get<CompanyConfig>('/assets/config/company.json').toPromise();
      if (envConfig) {
        this.setCompanyConfig(envConfig);
        return;
      }
    } catch (error) {
      console.warn('Could not load environment-specific config, using default');
    }

    // Fallback to default
    this._config.set(defaultCompanyConfig);
    this.applyConfigToTheme(defaultCompanyConfig);
  }

  setCompanyConfig(config: Partial<CompanyConfig>) {
    const newConfig = { ...this._config(), ...config };
    this._config.set(newConfig);
    this.applyConfigToTheme(newConfig);
    this.saveConfigToStorage(newConfig);
  }

  getCompanyConfig(): CompanyConfig {
    return this._config();
  }

  private applyConfigToTheme(config: CompanyConfig) {
    // Map CompanyConfig colors → StratosTheme colors
    this.setColors(config.theme);

    // Apply branding
    this.setCompanyBranding({
      logo: config.logos.main,
      navLogo: config.logos.navigation,
      navLogoIcon: config.logos.navigationIcon,
      favicon: config.logos.favicon,
      companyName: config.company.name,
      loginTitle: config.login.title,
      loginSubtitle: config.login.subtitle,
    });

    // Apply login customization — only include defined values to avoid overwriting theme defaults
    const loginCustom: Partial<StratosTheme['login']> = {
      showLogo: config.login.showLogo,
      showTitle: config.login.showTitle,
    };
    if (config.login.backgroundColor) loginCustom.backgroundColor = config.login.backgroundColor;
    if (config.login.cardBackground) loginCustom.cardBackground = config.login.cardBackground;
    if (config.login.customMessage) loginCustom.customMessage = config.login.customMessage;
    if (config.logos.loginBackground) loginCustom.backgroundImage = config.logos.loginBackground;
    this.setLoginCustomization(loginCustom);
  }

  private saveConfigToStorage(config: CompanyConfig) {
    try {
      localStorage.setItem(this.CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Could not save company config to localStorage');
    }
  }

  // =========================================================================
  // Theme Application (from StratosThemeService)
  // =========================================================================

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
    console.log('[StratosBrandingService] Applying theme:', theme);
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

  // =========================================================================
  // Theme Mode Management (from StratosThemeService)
  // =========================================================================

  setThemeMode(mode: ThemeMode) {
    console.log('[StratosBrandingService] Setting theme mode to:', mode);
    this._themeMode.set(mode);
    this.saveThemeModeToStorage(mode);
    this.applyThemeMode(mode);
  }

  getThemeMode(): ThemeMode {
    return this._themeMode();
  }

  toggleTheme() {
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
    console.log('[StratosBrandingService] System theme changed to:', event.matches ? 'dark' : 'light');
    // Only update if current mode is 'system'
    if (this._themeMode() === 'system') {
      this.applyThemeMode('system');
    }
  }

  // =========================================================================
  // Company Branding Overrides (from StratosThemeService)
  // =========================================================================

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

  // =========================================================================
  // Branding Persistence (from StratosThemeService)
  // =========================================================================

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

  // =========================================================================
  // Theme Mode Persistence (from StratosThemeService)
  // =========================================================================

  private loadThemeModeFromStorage(): ThemeMode | null {
    try {
      const saved = localStorage.getItem(this.THEME_MODE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch (error) {
      console.warn('Could not load theme mode from localStorage');
    }
    return null;
  }

  private saveThemeModeToStorage(mode: ThemeMode) {
    try {
      localStorage.setItem(this.THEME_MODE_KEY, mode);
    } catch (error) {
      console.warn('Could not save theme mode to localStorage');
    }
  }

  // =========================================================================
  // App Version Check (from StratosThemeService)
  // =========================================================================

  private checkAppVersion() {
    try {
      const storedVersion = localStorage.getItem(APP_VERSION_KEY);
      const currentVersion = BUILD_INFO.version;

      if (storedVersion !== currentVersion) {
        if (storedVersion) {
          console.log(`Stratos version changed (${storedVersion} → ${currentVersion}), clearing app preferences`);
        }
        NON_USER_KEYS.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(APP_VERSION_KEY, currentVersion);
      }
    } catch (error) {
      console.warn('Could not check app version in localStorage');
    }
  }

  // =========================================================================
  // Theme Utility Methods (from StratosThemeService)
  // =========================================================================

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

  // =========================================================================
  // Theme Reset/Export/Import (from StratosThemeService)
  // =========================================================================

  resetTheme() {
    this._customBranding = null;
    this._customLogin = null;
    localStorage.removeItem(this.BRANDING_STORAGE_KEY);
    this.applyThemeMode(this._themeMode());
  }

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

  // =========================================================================
  // Config Utility Methods (from CompanyConfigService)
  // =========================================================================

  getCompanyName(): string {
    return this._config().company.name;
  }

  getMainLogo(): string {
    return this._config().logos.main;
  }

  getNavigationLogo(): string {
    return this._config().logos.navigation;
  }

  getNavigationIcon(): string {
    return this._config().logos.navigationIcon;
  }

  getConfigPrimaryColor(): string {
    return this._config().theme.primary;
  }

  getLoginTitle(): string {
    return this._config().login.title;
  }

  getLoginSubtitle(): string | undefined {
    return this._config().login.subtitle;
  }

  getCopyrightText(): string | undefined {
    return this._config().footer.copyright;
  }

  // =========================================================================
  // Config Update Methods (from CompanyConfigService)
  // =========================================================================

  updateCompanyInfo(company: Partial<CompanyConfig['company']>) {
    const currentConfig = this._config();
    this.setCompanyConfig({
      ...currentConfig,
      company: { ...currentConfig.company, ...company }
    });
  }

  updateLogos(logos: Partial<CompanyConfig['logos']>) {
    const currentConfig = this._config();
    this.setCompanyConfig({
      ...currentConfig,
      logos: { ...currentConfig.logos, ...logos }
    });
  }

  updateThemeColors(theme: Partial<CompanyConfig['theme']>) {
    const currentConfig = this._config();
    this.setCompanyConfig({
      ...currentConfig,
      theme: { ...currentConfig.theme, ...theme }
    });
  }

  updateLoginConfig(login: Partial<CompanyConfig['login']>) {
    const currentConfig = this._config();
    this.setCompanyConfig({
      ...currentConfig,
      login: { ...currentConfig.login, ...login }
    });
  }

  // =========================================================================
  // Config Export/Import/Reset (from CompanyConfigService)
  // =========================================================================

  exportConfig(): string {
    return JSON.stringify(this._config(), null, 2);
  }

  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson) as CompanyConfig;
      this.setCompanyConfig(config);
      return true;
    } catch (error) {
      console.error('Invalid company config JSON', error);
      return false;
    }
  }

  resetToDefault() {
    this.setCompanyConfig(defaultCompanyConfig);
    localStorage.removeItem(this.CONFIG_STORAGE_KEY);
  }
}
