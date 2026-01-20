export interface StratosTheme {
  // Brand colors
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };

  // Navigation
  navigation: {
    background: string;
    text: string;
    textMuted?: string;
    hover: string;
    active: string;
    border?: string;
    tooltip?: string;
  };

  // Layout
  layout: {
    background: string;
    bodyBackground?: string;
    text: string;
    textMuted?: string;
    headerBackground: string;
    headerText: string;
    headerBorder?: string;
    contentBackground?: string;
    contentSecondary?: string;
    contentBorder?: string;
  };

  // Branding
  branding: {
    logo: string;
    navLogo: string;
    navLogoIcon: string;
    favicon: string;
    companyName: string;
    displayName?: string;
    loginTitle: string;
    loginSubtitle?: string;
    loginBackground?: string;
  };

  // Login page customization
  login: {
    showLogo: boolean;
    showTitle: boolean;
    backgroundImage?: string;
    backgroundColor?: string;
    cardBackground?: string;
    customMessage?: string;
    // New properties for split-screen glassmorphism design
    leftPanelGradientStart?: string;
    leftPanelGradientEnd?: string;
    showFeaturesList?: boolean;
    features?: string[];
    glassOpacity?: number;
    glassBlur?: number;
  };
}

// Light theme (default)
export const defaultTheme: StratosTheme = {
  colors: {
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
    textMuted: 'rgba(255, 255, 255, 0.7)',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.2)',
    border: 'rgba(255, 255, 255, 0.1)',
    tooltip: '#374151',
  },
  layout: {
    background: '#fafafa',
    bodyBackground: '#fafafa',
    text: 'rgba(0, 0, 0, 0.87)',
    textMuted: '#64748b',
    headerBackground: '#2196f3',
    headerText: '#ffffff',
    headerBorder: '#e2e8f0',
    contentBackground: '#ffffff',
    contentSecondary: '#f8fafc',
    contentBorder: '#e2e8f0',
  },
  branding: {
    logo: '/core/assets/logo.png',
    navLogo: '/core/assets/logo.png',
    navLogoIcon: '/core/assets/logo.png',
    favicon: '/favicon.ico',
    companyName: 'Stratos',
    loginTitle: 'Stratos Console',
    loginSubtitle: 'Multi-Cloud Management Platform',
  },
  login: {
    showLogo: true,
    showTitle: true,
    backgroundImage: '/core/assets/login-bg.jpg',
    backgroundColor: '#f5f5f5',
    cardBackground: '#ffffff',
    leftPanelGradientStart: '#2196f3',
    leftPanelGradientEnd: '#00bcd4',
    showFeaturesList: true,
    features: [
      'Multi-Cloud Management',
      'Unified Dashboard',
      'Enterprise Security',
    ],
    glassOpacity: 0.1,
    glassBlur: 20,
  },
};

// Dark theme
export const darkTheme: StratosTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  navigation: {
    background: '#1e293b',
    text: '#f1f5f9',
    textMuted: 'rgba(241, 245, 249, 0.7)',
    hover: 'rgba(241, 245, 249, 0.1)',
    active: 'rgba(241, 245, 249, 0.2)',
    border: 'rgba(241, 245, 249, 0.1)',
    tooltip: '#475569',
  },
  layout: {
    background: '#0f172a',
    bodyBackground: '#0f172a',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    headerBackground: '#1e293b',
    headerText: '#f1f5f9',
    headerBorder: '#334155',
    contentBackground: '#1e293b',
    contentSecondary: '#334155',
    contentBorder: '#475569',
  },
  branding: {
    logo: '/core/assets/logo.png',
    navLogo: '/core/assets/logo.png',
    navLogoIcon: '/core/assets/logo.png',
    favicon: '/favicon.ico',
    companyName: 'Stratos',
    loginTitle: 'Stratos Console',
    loginSubtitle: 'Multi-Cloud Management Platform',
  },
  login: {
    showLogo: true,
    showTitle: true,
    backgroundImage: '/core/assets/login-bg.jpg',
    backgroundColor: '#0f172a',
    cardBackground: '#1e293b',
    leftPanelGradientStart: '#3b82f6',
    leftPanelGradientEnd: '#06b6d4',
    showFeaturesList: true,
    features: [
      'Multi-Cloud Management',
      'Unified Dashboard',
      'Enterprise Security',
    ],
    glassOpacity: 0.7,
    glassBlur: 20,
  },
};

// Theme management service
export class ThemeService {
  private currentTheme: StratosTheme = defaultTheme;

  setTheme(theme: Partial<StratosTheme>) {
    this.currentTheme = { ...this.currentTheme, ...theme };
    this.applyTheme();
  }

  getTheme(): StratosTheme {
    return this.currentTheme;
  }

  private applyTheme() {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--color-primary', this.currentTheme.colors.primary);
    root.style.setProperty('--color-secondary', this.currentTheme.colors.secondary);
    root.style.setProperty('--color-accent', this.currentTheme.colors.accent);
    root.style.setProperty('--color-success', this.currentTheme.colors.success);
    root.style.setProperty('--color-warning', this.currentTheme.colors.warning);
    root.style.setProperty('--color-danger', this.currentTheme.colors.danger);
    root.style.setProperty('--color-info', this.currentTheme.colors.info);

    root.style.setProperty('--nav-bg', this.currentTheme.navigation.background);
    root.style.setProperty('--nav-text', this.currentTheme.navigation.text);
    root.style.setProperty('--nav-hover', this.currentTheme.navigation.hover);
    root.style.setProperty('--nav-active', this.currentTheme.navigation.active);

    root.style.setProperty('--app-bg', this.currentTheme.layout.background);
    root.style.setProperty('--app-text', this.currentTheme.layout.text);
    root.style.setProperty('--header-bg', this.currentTheme.layout.headerBackground);
    root.style.setProperty('--header-text', this.currentTheme.layout.headerText);

    root.style.setProperty('--logo-bg', this.currentTheme.branding.logo);
    root.style.setProperty('--login-bg', this.currentTheme.login.backgroundColor || this.currentTheme.layout.background);
    root.style.setProperty('--login-bg-image', `url(${this.currentTheme.login.backgroundImage || ''})`);
  }

  // Company customization methods
  setCompanyBranding(branding: Partial<StratosTheme['branding']>) {
    this.currentTheme.branding = { ...this.currentTheme.branding, ...branding };
    this.updateFavicon();
    this.applyTheme();
  }

  setLoginCustomization(login: Partial<StratosTheme['login']>) {
    this.currentTheme.login = { ...this.currentTheme.login, ...login };
    this.applyTheme();
  }

  private updateFavicon() {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = this.currentTheme.branding.favicon;
    }
  }

  // Load theme from configuration file or API
  async loadThemeFromConfig(configUrl?: string) {
    try {
      const url = configUrl || '/assets/theme-config.json';
      const response = await fetch(url);
      if (response.ok) {
        const themeConfig = await response.json();
        this.setTheme(themeConfig);
      }
    } catch (error) {
      console.warn('Could not load theme configuration, using default theme');
    }
  }
}