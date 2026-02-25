# Stratos Theme System

This package provides a comprehensive theming system for Stratos using Tailwind CSS, replacing the previous Angular Material theming approach.

## Features

- **Tailwind CSS Integration**: Modern utility-first CSS framework for styling
- **Custom Color System**: Centralized color management with CSS custom properties
- **Company Branding**: Easy customization of logos, colors, and company information
- **Login Page Customization**: Configurable login page with custom branding
- **Theme Service**: Angular service for runtime theme management
- **Configuration Files**: JSON-based theme configuration

## Quick Start

1. **Import the theme module** in your Angular application:
```typescript
import { StratosThemeModule } from '@stratos/theme';

@NgModule({
  imports: [StratosThemeModule]
})
export class AppModule { }
```

2. **Use theme services** in your components:
```typescript
import { StratosThemeService, CompanyConfigService } from '@stratos/theme';

constructor(
  private themeService: StratosThemeService,
  private companyConfig: CompanyConfigService
) {}
```

## Configuration

### Theme Configuration (`/assets/theme-config.json`)

```json
{
  "colors": {
    "primary": "#2196f3",
    "secondary": "#00bcd4",
    "accent": "#ff9800"
  },
  "navigation": {
    "background": "#2196f3",
    "text": "#ffffff"
  }
}
```

### Company Configuration (`/assets/company-config.json`)

```json
{
  "company": {
    "name": "Your Company"
  },
  "logos": {
    "main": "/assets/logo.png",
    "navigation": "/assets/nav-logo.png"
  },
  "login": {
    "title": "Company Console",
    "showLogo": true
  }
}
```

## Customization

### Colors

The theme system uses CSS custom properties for dynamic color management:

```css
:root {
  --color-primary: #2196f3;
  --color-secondary: #00bcd4;
  --nav-bg: #2196f3;
}
```

### Company Branding

Update company information programmatically:

```typescript
companyConfigService.updateCompanyInfo({
  name: 'New Company Name',
  website: 'https://example.com'
});

companyConfigService.updateLogos({
  main: '/assets/new-logo.png',
  navigation: '/assets/new-nav-logo.png'
});
```

### Login Page

Customize the login page appearance:

```typescript
companyConfigService.updateLoginConfig({
  title: 'Custom Login Title',
  backgroundColor: '#f0f0f0',
  showLogo: true,
  customMessage: 'Welcome to our platform'
});
```

## Tailwind Classes

The theme system includes pre-defined Tailwind utility classes:

### Status Colors
- `status-success` - Success state styling
- `status-warning` - Warning state styling
- `status-danger` - Error/danger state styling
- `status-info` - Info state styling

### Components
- `btn`, `btn-primary`, `btn-secondary` - Button styles
- `card`, `card-header`, `card-body` - Card layouts
- `input` - Form input styling
- `nav`, `nav-item` - Navigation components

### Theme Colors
- `text-primary`, `bg-primary` - Primary theme color
- `text-secondary`, `bg-secondary` - Secondary theme color

## Migration from Angular Material

Components have been converted to use Tailwind classes:

**Before:**
```html
<app-card class="example-card">
  <app-card-header>Title</app-card-header>
</app-card>
```

**After:**
```html
<app-card class="example-card">
  <app-card-header>Title</app-card-header>
</app-card>
```

Or using Tailwind utility classes directly:
```html
<div class="card">
  <div class="card-header">Title</div>
</div>
```

## Development

### Adding New Theme Properties

1. Update the `StratosTheme` interface in `theme.config.ts`
2. Add default values in `defaultTheme`
3. Update the `applyTheme` method in `StratosThemeService`
4. Add corresponding CSS custom properties in `main.css`

### Component Styling

Use Tailwind utility classes with theme-aware custom properties:

```html
<div class="bg-primary text-white p-4 rounded-lg">
  Themed component
</div>
```

## API Reference

### StratosThemeService

- `setTheme(theme: Partial<StratosTheme>)` - Update theme configuration
- `getTheme(): StratosTheme` - Get current theme
- `setColors(colors: Partial<Colors>)` - Update color scheme
- `resetTheme()` - Reset to default theme

### CompanyConfigService

- `setCompanyConfig(config: Partial<CompanyConfig>)` - Update company config
- `updateCompanyInfo(info: Partial<CompanyInfo>)` - Update company information
- `updateLogos(logos: Partial<LogoConfig>)` - Update logo configuration
- `exportConfig(): string` - Export configuration as JSON

## Browser Support

The theme system supports all modern browsers with CSS custom properties support:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 16+
