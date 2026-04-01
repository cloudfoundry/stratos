export interface CompanyConfig {
  // Company branding
  company: {
    name: string;
    website?: string;
    supportEmail?: string;
  };

  // Logo customization
  logos: {
    main: string;           // Main logo for login page and headers
    navigation: string;     // Logo for navigation bar
    navigationIcon: string; // Icon-only logo for collapsed nav
    favicon: string;        // Browser favicon
    loginBackground?: string; // Custom login background image
  };

  // Color scheme customization
  theme: {
    primary: string;        // Primary brand color
    secondary: string;      // Secondary brand color
    accent: string;         // Accent color
    success: string;        // Success status color
    warning: string;        // Warning status color
    danger: string;         // Error/danger color
    info: string;           // Info color
  };

  // Navigation customization
  navigation: {
    background: string;     // Navigation background color
    text: string;           // Navigation text color
    hover: string;          // Navigation hover effect color
    active: string;         // Active navigation item color
  };

  // Layout customization
  layout: {
    background: string;     // App background color
    text: string;           // Primary text color
    headerBackground: string; // Header background color
    headerText: string;     // Header text color
  };

  // Login page customization
  login: {
    title: string;          // Login page title
    subtitle?: string;      // Login page subtitle
    showLogo: boolean;      // Whether to show logo on login
    showTitle: boolean;     // Whether to show title on login
    backgroundColor?: string; // Login page background color
    cardBackground?: string;  // Login card background color
    customMessage?: string;   // Custom message on login page
  };

  // Footer/copyright
  footer: {
    copyright?: string;     // Copyright text
    additionalInfo?: string; // Additional footer information
  };

  // Deployment defaults — overridden by user/page preferences once set
  defaults?: {
    // User preference defaults (Layer 3)
    themeMode?: 'light' | 'dark' | 'system';
    sidebarOpen?: boolean;
    sidebarPinned?: boolean;
    pollingEnabled?: boolean;
    sessionTimeout?: boolean;
    gravatarEnabled?: boolean;

    // Page preference defaults (Layer 4)
    pageSize?: number;
    pageSizeCards?: number[];
    pageSizeTable?: number[];
    viewMode?: 'table' | 'cards';
    sortDirection?: 'asc' | 'desc';
  };
}