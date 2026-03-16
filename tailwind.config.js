/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./src/**/*.{html,ts}",
    "./src/frontend/packages/core/src/**/*.{html,ts}",
    "./src/frontend/packages/cloud-foundry/src/**/*.{html,ts}",
    "./src/frontend/packages/kubernetes/src/**/*.{html,ts}",
    "./src/frontend/packages/git/src/**/*.{html,ts}",
    "./src/frontend/packages/cf-autoscaler/src/**/*.{html,ts}",
    "./src/frontend/packages/desktop-extensions/src/**/*.{html,ts}",
    "./src/frontend/packages/shared/src/**/*.{html,ts}",
    // Exclude test files and e2e helpers that contain regex patterns
    "!./src/test-e2e/**/*",
    "!./src/**/*.spec.ts",
    "!./src/**/*.test.ts"
  ],
  safelist: [
    // Progress bar colors (dynamically applied)
    'bg-brand-400',
    'bg-brand-500',
    'bg-brand-600',
    'bg-accent-shade-400',
    'bg-accent-shade-500',
    'bg-accent-shade-600',
    'bg-danger-shade-400',
    'bg-danger-shade-500',
    'bg-danger-shade-600',
    // Scroll shadow gradient
    'from-app-bg',
    'bg-gradient-to-t',
  ],
  theme: {
    extend: {
      // ========================================
      // COLOR SYSTEM - Complete Design Tokens
      // ========================================
      colors: {
        // Primary brand colors (Material Blue)
        'brand': {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },

        // Secondary accent colors (Cyan)
        'accent-shade': {
          50: '#e0f7fa',
          100: '#b2ebf2',
          200: '#80deea',
          300: '#4dd0e1',
          400: '#26c6da',
          500: '#00bcd4',
          600: '#00acc1',
          700: '#0097a7',
          800: '#00838f',
          900: '#006064',
        },

        // Status colors - Success (Green)
        'success-shade': {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },

        // Status colors - Warning (Orange)
        'warning-shade': {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
        },

        // Status colors - Danger (Red)
        'danger-shade': {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336',
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },

        // Status colors - Info (Blue)
        'info-shade': {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },

        // Semantic colors (CSS variable-based for theme support)
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'danger': 'var(--color-danger)',
        'info': 'var(--color-info)',

        // Navigation semantic tokens
        'nav': {
          bg: 'var(--nav-bg)',
          text: 'var(--nav-text)',
          'text-muted': 'var(--nav-text-muted)',
          hover: 'var(--nav-hover)',
          active: 'var(--nav-active)',
          border: 'var(--nav-border)',
          tooltip: 'var(--nav-tooltip)',
        },

        // Layout semantic tokens
        'app': {
          bg: 'var(--app-bg)',
          text: 'var(--app-text)',
        },
        'body': {
          bg: 'var(--body-bg)',
        },
        'header': {
          bg: 'var(--header-bg)',
          text: 'var(--header-text)',
          border: 'var(--header-border)',
        },
        'content': {
          bg: 'var(--content-bg)',
          secondary: 'var(--content-secondary)',
          border: 'var(--content-border)',
          text: 'var(--content-text)',
          muted: 'var(--content-muted)',
        },

        // Specialized tokens
        'logo-bg': 'var(--logo-bg)',
        'login': {
          bg: 'var(--login-bg)',
          card: 'var(--login-card-bg)',
        },
      },

      // ========================================
      // TYPOGRAPHY SYSTEM
      // ========================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Extended typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },

      // ========================================
      // SPACING SYSTEM
      // ========================================
      spacing: {
        // Extended spacing scale (px values)
        '0': '0',
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '1.5': '0.375rem',  // 6px
        '2': '0.5rem',      // 8px
        '2.5': '0.625rem',  // 10px
        '3': '0.75rem',     // 12px
        '3.5': '0.875rem',  // 14px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '7': '1.75rem',     // 28px
        '8': '2rem',        // 32px
        '9': '2.25rem',     // 36px
        '10': '2.5rem',     // 40px
        '11': '2.75rem',    // 44px
        '12': '3rem',       // 48px
        '14': '3.5rem',     // 56px
        '16': '4rem',       // 64px
        '20': '5rem',       // 80px
        '24': '6rem',       // 96px
        '28': '7rem',       // 112px
        '32': '8rem',       // 128px
        '36': '9rem',       // 144px
        '40': '10rem',      // 160px
        '44': '11rem',      // 176px
        '48': '12rem',      // 192px
        '52': '13rem',      // 208px
        '56': '14rem',      // 224px
        '60': '15rem',      // 240px
        '64': '16rem',      // 256px
        '72': '18rem',      // 288px
        '80': '20rem',      // 320px
        '96': '24rem',      // 384px
      },

      // ========================================
      // BORDER SYSTEM
      // ========================================
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',   // 2px
        DEFAULT: '0.25rem',  // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px
        '3xl': '1.5rem',    // 24px
        'full': '9999px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '0': '0',
        '2': '2px',
        '4': '4px',
        '8': '8px',
      },

      // ========================================
      // SHADOW SYSTEM (Elevation)
      // ========================================
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'md': '0 6px 16px -1px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 24px -3px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 32px -3px rgba(0, 0, 0, 0.1), 0 12px 24px -4px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
        // Material Design elevation shadows
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        'elevation-4': '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
        'elevation-5': '0 20px 40px rgba(0,0,0,0.2)',
      },

      // ========================================
      // TRANSITION & ANIMATION SYSTEM
      // ========================================
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      transitionTimingFunction: {
        'ease-in-out-cubic': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in-cubic': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-out-cubic': 'cubic-bezier(0, 0, 0.2, 1)',
        'material-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'material-deceleration': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'material-acceleration': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'material-sharp': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Enhanced dialog animations
        'dialog-enter': 'dialogEnter 0.25s cubic-bezier(0.0, 0.0, 0.2, 1)',
        'dialog-exit': 'dialogExit 0.2s cubic-bezier(0.4, 0.0, 1, 1)',
        'backdrop-enter': 'backdropEnter 0.3s cubic-bezier(0.0, 0.0, 0.2, 1)',
        'backdrop-exit': 'backdropExit 0.2s cubic-bezier(0.4, 0.0, 1, 1)',
        'dialog-scale-fade-in': 'dialogScaleFadeIn 0.25s cubic-bezier(0.0, 0.0, 0.2, 1)',
        'dialog-scale-fade-out': 'dialogScaleFadeOut 0.2s cubic-bezier(0.4, 0.0, 1, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        // Enhanced dialog animations with scale + fade
        dialogEnter: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9) translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) translateY(0)',
          },
        },
        dialogExit: {
          '0%': {
            opacity: '1',
            transform: 'scale(1) translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.9) translateY(-20px)',
          },
        },
        backdropEnter: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        backdropExit: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        dialogScaleFadeIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.85)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        dialogScaleFadeOut: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.85)',
          },
        },
      },

      // ========================================
      // LAYOUT TOKENS
      // ========================================
      maxWidth: {
        'xs': '20rem',    // 320px
        'sm': '24rem',    // 384px
        'md': '28rem',    // 448px
        'lg': '32rem',    // 512px
        'xl': '36rem',    // 576px
        '2xl': '42rem',   // 672px
        '3xl': '48rem',   // 768px
        '4xl': '56rem',   // 896px
        '5xl': '64rem',   // 1024px
        '6xl': '72rem',   // 1152px
        '7xl': '80rem',   // 1280px
        'full': '100%',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },

      // ========================================
      // Z-INDEX SYSTEM
      // ========================================
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },

      // ========================================
      // OPACITY SYSTEM
      // ========================================
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '15': '0.15',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '85': '0.85',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },

      // ========================================
      // BACKGROUND IMAGES
      // ========================================
      backgroundImage: {
        'login-bg': 'var(--login-bg-image)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}