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
    await this.loadThemeFromConfig();
    this.applyTheme(this.themeSubject.value);
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
    const root = document.documentElement;

    // Apply color variables
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
    root.style.setProperty('--nav-hover', theme.navigation.hover);
    root.style.setProperty('--nav-active', theme.navigation.active);

    // Apply layout variables
    root.style.setProperty('--app-bg', theme.layout.background);
    root.style.setProperty('--app-text', theme.layout.text);
    root.style.setProperty('--header-bg', theme.layout.headerBackground);
    root.style.setProperty('--header-text', theme.layout.headerText);

    // Apply login variables
    root.style.setProperty('--login-bg', theme.login.backgroundColor || theme.layout.background);
    root.style.setProperty('--login-card-bg', theme.login.cardBackground || '#ffffff');
    root.style.setProperty('--login-bg-image', `url(${theme.login.backgroundImage || ''})`);

    // Update document title and favicon
    this.updateBranding(theme);
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
    try {
      // Try to load from localStorage first
      const savedTheme = localStorage.getItem('stratos-theme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        this.themeSubject.next(theme);
        return;
      }

      // Try to load from config file
      const response = await fetch('/assets/theme-config.json');
      if (response.ok) {
        const themeConfig = await response.json();
        this.themeSubject.next({ ...defaultTheme, ...themeConfig });
        return;
      }
    } catch (error) {
      console.warn('Could not load theme configuration, using default theme');
    }

    // Fallback to default theme
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