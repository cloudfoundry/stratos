/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/frontend/packages/core/src/**/*.{html,ts}",
    "./src/frontend/packages/cloud-foundry/src/**/*.{html,ts}",
    "./src/frontend/packages/kubernetes/src/**/*.{html,ts}",
    "./src/frontend/packages/git/src/**/*.{html,ts}",
    "./src/frontend/packages/cf-autoscaler/src/**/*.{html,ts}",
    "./src/frontend/packages/desktop-extensions/src/**/*.{html,ts}",
    "./src/frontend/packages/shared/src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
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
        // Secondary accent colors (using shade scale)
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
        // Status colors (using shade scale)
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
        // Navigation colors
        'nav': {
          bg: 'var(--nav-bg)',
          text: 'var(--nav-text)',
          'text-muted': 'var(--nav-text-muted)',
          hover: 'var(--nav-hover)',
          active: 'var(--nav-active)',
          border: 'var(--nav-border)',
          tooltip: 'var(--nav-tooltip)',
        },
        // Layout colors
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
        // Theme customizable colors
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'danger': 'var(--color-danger)',
        'info': 'var(--color-info)',
        'logo-bg': 'var(--logo-bg)',
        'login-bg': 'var(--login-bg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'login-bg': 'var(--login-bg-image)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}