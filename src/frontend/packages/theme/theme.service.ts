import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StratosTheme, defaultTheme } from './theme.config';

@Injectable({
  providedIn: 'root'
})
export class StratosThemeService {
  private themeSubject = new BehaviorSubject<StratosTheme>(defaultTheme);
  public theme$: Observable<StratosTheme> = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private async initializeTheme() {
    console.log('[StratosThemeService] Initializing theme...');
    await this.loadThemeFromConfig();
    console.log('[StratosThemeService] Theme loaded:', this.themeSubject.value);
    this.applyTheme(this.themeSubject.value);
    console.log('[StratosThemeService] Theme applied to DOM');
  }

  setTheme(theme: Partial<StratosTheme>) {
    const newTheme = { ...this.themeSubject.value, ...theme };
    this.themeSubject.next(newTheme);
    this.applyTheme(newTheme);
    this.saveThemeToStorage(newTheme);
  }

  getTheme(): StratosTheme {
    return this.themeSubject.value;
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
    
    console.log('[StratosThemeService] CSS variables set on document root');
  }

  private updateBranding(theme: StratosTheme) {
    // Update page title
    document.title = theme.branding.companyName;

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = theme.branding.favicon;
    } else {
      // Create favicon link if it doesn't exist
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = theme.branding.favicon;
      document.head.appendChild(newFavicon);
    }
  }

  // Company branding methods
  setCompanyBranding(branding: Partial<StratosTheme['branding']>) {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = {
      ...currentTheme,
      branding: { ...currentTheme.branding, ...branding }
    };
    this.setTheme(updatedTheme);
  }

  setLoginCustomization(login: Partial<StratosTheme['login']>) {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = {
      ...currentTheme,
      login: { ...currentTheme.login, ...login }
    };
    this.setTheme(updatedTheme);
  }

  setColors(colors: Partial<StratosTheme['colors']>) {
    const currentTheme = this.themeSubject.value;
    const updatedTheme = {
      ...currentTheme,
      colors: { ...currentTheme.colors, ...colors }
    };
    this.setTheme(updatedTheme);
  }

  // Load theme from various sources
  private async loadThemeFromConfig() {
    console.log('[StratosThemeService] Loading theme from config...');
    try {
      // Try to load from localStorage first
      const savedTheme = localStorage.getItem('stratos-theme');
      if (savedTheme) {
        console.log('[StratosThemeService] Found saved theme in localStorage');
        const theme = JSON.parse(savedTheme);
        this.themeSubject.next(theme);
        return;
      }

      // Try to load from config file
      console.log('[StratosThemeService] Fetching theme from /core/assets/theme-config.json');
      const response = await fetch('/core/assets/theme-config.json');
      if (response.ok) {
        const themeConfig = await response.json();
        console.log('[StratosThemeService] Loaded theme config:', themeConfig);
        this.themeSubject.next({ ...defaultTheme, ...themeConfig });
        return;
      } else {
        console.warn('[StratosThemeService] Failed to fetch theme config:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('[StratosThemeService] Could not load theme configuration:', error);
    }

    // Fallback to default theme
    console.log('[StratosThemeService] Using default theme');
    this.themeSubject.next(defaultTheme);
  }

  private saveThemeToStorage(theme: StratosTheme) {
    try {
      localStorage.setItem('stratos-theme', JSON.stringify(theme));
    } catch (error) {
      console.warn('Could not save theme to localStorage');
    }
  }

  // Utility methods for components
  getPrimaryColor(): string {
    return this.themeSubject.value.colors.primary;
  }

  getSecondaryColor(): string {
    return this.themeSubject.value.colors.secondary;
  }

  getNavBackground(): string {
    return this.themeSubject.value.navigation.background;
  }

  getBrandingInfo() {
    return this.themeSubject.value.branding;
  }

  getLoginConfig() {
    return this.themeSubject.value.login;
  }

  // Reset to default theme
  resetTheme() {
    this.setTheme(defaultTheme);
    localStorage.removeItem('stratos-theme');
  }

  // Export/import theme configuration
  exportTheme(): string {
    return JSON.stringify(this.themeSubject.value, null, 2);
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