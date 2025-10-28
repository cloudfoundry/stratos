import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { CompanyConfig } from './company-config.interface';
import { StratosThemeService } from './theme.service';

// Default company configuration
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
  },
  theme: {
    primary: '#2196f3',
    secondary: '#00bcd4',
    accent: '#ff9800',
    success: '#4caf50',
    warning: '#ff9800',
    danger: '#f44336',
    info: '#2196f3',
  },
  navigation: {
    background: '#2196f3',
    text: '#ffffff',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.2)',
  },
  layout: {
    background: '#fafafa',
    text: 'rgba(0, 0, 0, 0.87)',
    headerBackground: '#2196f3',
    headerText: '#ffffff',
  },
  login: {
    title: 'Console',
    subtitle: 'Multi-Cloud Management Platform',
    showLogo: true,
    showTitle: true,
    backgroundColor: '#f5f5f5',
    cardBackground: '#ffffff',
  },
  footer: {
    copyright: 'Your Company Name',
  },
};

@Injectable({
  providedIn: 'root'
})
export class CompanyConfigService {
  private configSubject = new BehaviorSubject<CompanyConfig>(defaultCompanyConfig);
  public config$: Observable<CompanyConfig> = this.configSubject.asObservable();

  constructor(
    private http: HttpClient,
    private themeService: StratosThemeService
  ) {
    this.loadCompanyConfig();
  }

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
    this.configSubject.next(defaultCompanyConfig);
    this.applyConfigToTheme(defaultCompanyConfig);
  }

  setCompanyConfig(config: Partial<CompanyConfig>) {
    const newConfig = { ...this.configSubject.value, ...config };
    this.configSubject.next(newConfig);
    this.applyConfigToTheme(newConfig);
    this.saveConfigToStorage(newConfig);
  }

  getCompanyConfig(): CompanyConfig {
    return this.configSubject.value;
  }

  private applyConfigToTheme(config: CompanyConfig) {
    // Apply theme colors
    this.themeService.setColors(config.theme);

    // Apply branding
    this.themeService.setCompanyBranding({
      logo: config.logos.main,
      navLogo: config.logos.navigation,
      navLogoIcon: config.logos.navigationIcon,
      favicon: config.logos.favicon,
      companyName: config.company.name,
      loginTitle: config.login.title,
      loginSubtitle: config.login.subtitle,
    });

    // Apply login customization
    this.themeService.setLoginCustomization({
      showLogo: config.login.showLogo,
      showTitle: config.login.showTitle,
      backgroundColor: config.login.backgroundColor,
      cardBackground: config.login.cardBackground,
      customMessage: config.login.customMessage,
      backgroundImage: config.logos.loginBackground,
    });

    // Apply layout theme
    this.themeService.setTheme({
      navigation: config.navigation,
      layout: config.layout,
    });
  }

  private saveConfigToStorage(config: CompanyConfig) {
    try {
      localStorage.setItem('stratos-company-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Could not save company config to localStorage');
    }
  }

  // Utility methods for easy access to common config values
  getCompanyName(): string {
    return this.configSubject.value.company.name;
  }

  getMainLogo(): string {
    return this.configSubject.value.logos.main;
  }

  getNavigationLogo(): string {
    return this.configSubject.value.logos.navigation;
  }

  getNavigationIcon(): string {
    return this.configSubject.value.logos.navigationIcon;
  }

  getPrimaryColor(): string {
    return this.configSubject.value.theme.primary;
  }

  getLoginTitle(): string {
    return this.configSubject.value.login.title;
  }

  getLoginSubtitle(): string | undefined {
    return this.configSubject.value.login.subtitle;
  }

  getCopyrightText(): string | undefined {
    return this.configSubject.value.footer.copyright;
  }

  // Methods for updating specific parts of the config
  updateCompanyInfo(company: Partial<CompanyConfig['company']>) {
    const currentConfig = this.configSubject.value;
    this.setCompanyConfig({
      ...currentConfig,
      company: { ...currentConfig.company, ...company }
    });
  }

  updateLogos(logos: Partial<CompanyConfig['logos']>) {
    const currentConfig = this.configSubject.value;
    this.setCompanyConfig({
      ...currentConfig,
      logos: { ...currentConfig.logos, ...logos }
    });
  }

  updateThemeColors(theme: Partial<CompanyConfig['theme']>) {
    const currentConfig = this.configSubject.value;
    this.setCompanyConfig({
      ...currentConfig,
      theme: { ...currentConfig.theme, ...theme }
    });
  }

  updateLoginConfig(login: Partial<CompanyConfig['login']>) {
    const currentConfig = this.configSubject.value;
    this.setCompanyConfig({
      ...currentConfig,
      login: { ...currentConfig.login, ...login }
    });
  }

  // Export/import functionality
  exportConfig(): string {
    return JSON.stringify(this.configSubject.value, null, 2);
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
    localStorage.removeItem('stratos-company-config');
  }
}