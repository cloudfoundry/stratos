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
  };
}

// Light theme (default) — values must match :root in main.scss
export const defaultTheme: StratosTheme = {
  colors: {
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
    textMuted: 'rgba(255, 255, 255, 0.7)',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.1)',
    tooltip: '#374151',
  },
  layout: {
    background: '#f8fafc',
    bodyBackground: '#f1f5f9',
    text: '#1e293b',
    textMuted: '#64748b',
    headerBackground: '#ffffff',
    headerText: '#1e293b',
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
  },
};
