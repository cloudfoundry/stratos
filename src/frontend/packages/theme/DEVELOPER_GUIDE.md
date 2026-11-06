# Stratos Theme System - Developer Guide

> **Complete guide for building pages and components using the Stratos Tailwind CSS theme system**

## 🚀 Quick Start

When creating new pages or components for Stratos, you now use **Tailwind CSS** with our custom theme system instead of Angular Material. This guide shows you everything you need to know.

### Basic Setup

1. **Import the theme service** (optional, for dynamic theming):
```typescript
import { StratosThemeService } from '@stratos/theme';

constructor(private themeService: StratosThemeService) {}
```

2. **Use Tailwind classes** in your templates instead of Angular Material.

## 🎨 Theme Classes Reference

### **Buttons**
Replace `mat-button`, `mat-raised-button`, `mat-icon-button` with these:

```html
<!-- Primary button -->
<button class="btn btn-primary">Save</button>

<!-- Secondary button -->
<button class="btn btn-secondary">Cancel</button>

<!-- Danger button -->
<button class="btn btn-danger">Delete</button>

<!-- Icon button -->
<button class="btn btn-icon">
  <span class="material-icons">edit</span>
</button>

<!-- Button with loading state -->
<button class="btn btn-primary" [disabled]="loading">
  <div *ngIf="loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  <span *ngIf="!loading">Submit</span>
</button>
```

### **Cards**
Replace `mat-card` with our card system:

```html
<!-- Basic card -->
<div class="card">
  <div class="card-header">
    <h3 class="text-lg font-semibold">Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content goes here</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>

<!-- Card with status indicator -->
<div class="card relative">
  <div class="absolute top-0 left-0 w-full h-1 bg-success-shade-500 rounded-t-lg"></div>
  <div class="card-body">Content</div>
</div>
```

### **Forms**
Replace `mat-form-field` with our form system:

```html
<!-- Form field with label -->
<div class="form-group">
  <label for="username" class="label">Username</label>
  <input id="username" class="input" type="text" placeholder="Enter username">
  <div class="text-red-500 text-sm mt-1">Error message</div>
</div>

<!-- Select dropdown -->
<div class="form-group">
  <label for="status" class="label">Status</label>
  <select id="status" class="input">
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</div>

<!-- Checkbox -->
<label class="checkbox-label">
  <input type="checkbox" class="checkbox">
  <span class="checkbox-text">Remember me</span>
</label>

<!-- Radio buttons -->
<div class="space-y-3">
  <label class="radio-label">
    <input type="radio" name="option" class="radio">
    <span class="radio-text">Option 1</span>
  </label>
  <label class="radio-label">
    <input type="radio" name="option" class="radio">
    <span class="radio-text">Option 2</span>
  </label>
</div>
```

### **Tables**
Replace `mat-table` with our table system:

```html
<div class="card">
  <div class="card-header">
    <h3 class="text-lg font-semibold">Data Table</h3>
  </div>
  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr class="list-item">
          <td class="font-medium">John Doe</td>
          <td>
            <span class="status-success">Active</span>
          </td>
          <td>
            <button class="btn btn-icon btn-sm">
              <span class="material-icons">edit</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### **Icons**
Replace `mat-icon` with Material Icons spans:

```html
<!-- Basic icon -->
<span class="material-icons">home</span>

<!-- Icon with custom size and color -->
<span class="material-icons text-primary text-2xl">star</span>

<!-- Icon in button -->
<button class="btn btn-primary">
  <span class="material-icons mr-2">add</span>
  Add Item
</button>
```

### **Alerts and Status**
Show status messages and alerts:

```html
<!-- Success alert -->
<div class="alert alert-success">
  Operation completed successfully!
</div>

<!-- Warning alert -->
<div class="alert alert-warning">
  Please review your settings.
</div>

<!-- Error alert -->
<div class="alert alert-danger">
  An error occurred. Please try again.
</div>

<!-- Info alert -->
<div class="alert alert-info">
  New feature available!
</div>

<!-- Status badges -->
<span class="status-success">Running</span>
<span class="status-warning">Pending</span>
<span class="status-danger">Failed</span>
<span class="status-info">Processing</span>
```

### **Loading States**
Replace `mat-progress-bar` and `mat-spinner`:

```html
<!-- Progress bar -->
<div class="progress">
  <div class="progress-bar" [style.width.%]="progressValue"></div>
</div>

<!-- Indeterminate progress -->
<div class="progress">
  <div class="progress-bar w-full animate-pulse"></div>
</div>

<!-- Spinner -->
<div class="spinner spinner-primary"></div>

<!-- Loading page overlay -->
<div class="loading-page">
  <div class="text-center">
    <div class="spinner-primary mx-auto mb-4"></div>
    <p>Loading...</p>
  </div>
</div>
```

## 🎯 Theme Colors

Use semantic color classes that automatically adapt to the theme:

### **Primary Colors**
```html
<!-- Text colors -->
<p class="text-primary">Primary text</p>
<p class="text-brand-600">Darker primary</p>

<!-- Background colors -->
<div class="bg-primary text-white">Primary background</div>
<div class="bg-brand-50">Light primary background</div>

<!-- Border colors -->
<div class="border border-primary">Primary border</div>
```

### **Status Colors**
```html
<!-- Success -->
<p class="text-success-shade-600">Success text</p>
<div class="bg-success-shade-500">Success background</div>

<!-- Warning -->
<p class="text-warning-shade-600">Warning text</p>
<div class="bg-warning-shade-500">Warning background</div>

<!-- Danger -->
<p class="text-danger-shade-600">Error text</p>
<div class="bg-danger-shade-500">Error background</div>

<!-- Info -->
<p class="text-info-shade-600">Info text</p>
<div class="bg-info-shade-500">Info background</div>
```

### **Navigation Colors**
```html
<!-- Use theme-aware navigation colors -->
<nav class="bg-nav-bg text-nav-text">
  <a class="nav-item">Home</a>
</nav>
```

## 🏗️ Layout Patterns

### **Page Layout**
Standard page structure:

```html
<div class="page-container p-6">
  <!-- Page header -->
  <div class="page-header mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Page Title</h1>
    <p class="text-gray-600 mt-1">Page description</p>
  </div>

  <!-- Page content -->
  <div class="page-content">
    <!-- Your content here -->
  </div>
</div>
```

### **Grid Layouts**
Responsive grid systems:

```html
<!-- Card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>

<!-- Form grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="form-group">
    <label class="label">First Name</label>
    <input class="input">
  </div>
  <div class="form-group">
    <label class="label">Last Name</label>
    <input class="input">
  </div>
</div>
```

### **Sidebar Layout**
For pages with sidebars:

```html
<div class="flex">
  <!-- Sidebar -->
  <div class="w-64 bg-gray-50 border-r border-gray-200 p-4">
    <nav class="space-y-2">
      <a class="nav-item block p-2 rounded hover:bg-gray-100">Item 1</a>
      <a class="nav-item block p-2 rounded hover:bg-gray-100">Item 2</a>
    </nav>
  </div>

  <!-- Main content -->
  <div class="flex-1 p-6">
    <!-- Page content -->
  </div>
</div>
```

## 📱 Responsive Design

Use Tailwind's responsive prefixes:

```html
<!-- Responsive cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <div class="card">Responsive card</div>
</div>

<!-- Responsive text -->
<h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl">Responsive heading</h1>

<!-- Show/hide on mobile -->
<div class="hidden md:block">Desktop only content</div>
<div class="block md:hidden">Mobile only content</div>

<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8">Responsive padding</div>
```

## 🔧 Component Examples

### **List/Table Component**
```html
<div class="card">
  <div class="card-header flex items-center justify-between">
    <h3 class="text-lg font-semibold">Applications</h3>
    <button class="btn btn-primary">
      <span class="material-icons mr-2">add</span>
      Add App
    </button>
  </div>

  <div class="card-body p-0">
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Memory</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="list-item" *ngFor="let app of applications">
            <td class="font-medium">{{ app.name }}</td>
            <td>
              <span [ngClass]="{
                'status-success': app.status === 'running',
                'status-warning': app.status === 'pending',
                'status-danger': app.status === 'failed'
              }">
                {{ app.status }}
              </span>
            </td>
            <td>{{ app.memory }}MB</td>
            <td>
              <div class="flex space-x-2">
                <button class="btn btn-icon btn-sm">
                  <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-icon btn-sm text-red-600">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

### **Form Component**
```html
<div class="card max-w-md mx-auto">
  <div class="card-header">
    <h2 class="text-xl font-semibold">Create Application</h2>
  </div>

  <form class="card-body space-y-4" (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label for="appName" class="label">Application Name</label>
      <input id="appName" class="input" type="text"
             [(ngModel)]="appName" required>
      <div *ngIf="errors.appName" class="text-red-500 text-sm mt-1">
        {{ errors.appName }}
      </div>
    </div>

    <div class="form-group">
      <label for="environment" class="label">Environment</label>
      <select id="environment" class="input" [(ngModel)]="environment">
        <option value="dev">Development</option>
        <option value="staging">Staging</option>
        <option value="prod">Production</option>
      </select>
    </div>

    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" class="checkbox" [(ngModel)]="enableSSL">
        <span class="checkbox-text">Enable SSL</span>
      </label>
    </div>

    <div class="card-footer flex space-x-3">
      <button type="button" class="btn btn-secondary flex-1">Cancel</button>
      <button type="submit" class="btn btn-primary flex-1"
              [disabled]="!isValid()">
        <div *ngIf="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        Create
      </button>
    </div>
  </form>
</div>
```

### **Dashboard Widget**
```html
<div class="card">
  <div class="card-header flex items-center justify-between">
    <h3 class="text-lg font-semibold">System Status</h3>
    <button class="btn btn-icon btn-sm">
      <span class="material-icons">refresh</span>
    </button>
  </div>

  <div class="card-body">
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="text-center">
        <div class="text-3xl font-bold text-success-shade-600">{{ metrics.healthy }}</div>
        <div class="text-sm text-gray-600">Healthy</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-warning-shade-600">{{ metrics.warning }}</div>
        <div class="text-sm text-gray-600">Warning</div>
      </div>
    </div>

    <div class="progress mb-2">
      <div class="progress-bar bg-success-shade-500"
           [style.width.%]="(metrics.healthy / metrics.total) * 100"></div>
    </div>
    <div class="text-sm text-gray-600 text-center">
      {{ metrics.healthy }} of {{ metrics.total }} services healthy
    </div>
  </div>
</div>
```

## 🎨 Dynamic Theming (Advanced)

For components that need to respond to theme changes:

```typescript
export class MyComponent implements OnInit {
  theme$ = this.themeService.theme$;

  constructor(private themeService: StratosThemeService) {}

  // Change theme programmatically
  switchToCustomTheme() {
    this.themeService.setColors({
      primary: '#ff6b6b',
      secondary: '#4ecdc4'
    });
  }

  // Get current theme values
  getCurrentPrimaryColor(): string {
    return this.themeService.getPrimaryColor();
  }
}
```

```html
<!-- React to theme changes -->
<div class="card" [style.border-color]="(theme$ | async)?.colors.primary">
  Theme-aware component
</div>
```

## ✨ Best Practices

### **1. Use Semantic Classes**
```html
<!-- Good: Semantic and theme-aware -->
<button class="btn btn-primary">Submit</button>
<div class="alert alert-success">Success message</div>

<!-- Bad: Low-level utility classes -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">Submit</button>
```

### **2. Consistent Spacing**
```html
<!-- Use consistent spacing scale -->
<div class="space-y-4">  <!-- 1rem spacing -->
  <div class="space-y-6">  <!-- 1.5rem spacing -->
    <div class="space-y-8">  <!-- 2rem spacing -->
```

### **3. Responsive Design**
```html
<!-- Always consider mobile-first -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="p-4 md:p-6">Content</div>
</div>
```

### **4. Accessibility**
```html
<!-- Always include proper labels and ARIA attributes -->
<label for="input-id" class="label">Field Label</label>
<input id="input-id" class="input" aria-describedby="help-text">
<div id="help-text" class="text-sm text-gray-600">Help text</div>
```

### **5. Loading States**
```html
<!-- Always provide loading feedback -->
<button class="btn btn-primary" [disabled]="loading">
  <div *ngIf="loading" class="spinner w-4 h-4 mr-2"></div>
  {{ loading ? 'Submitting...' : 'Submit' }}
</button>
```

## 🚫 What NOT to Use

**Avoid these Angular Material components entirely:**
- `mat-button` → Use `btn` classes
- `mat-card` → Use `card` classes
- `mat-form-field` → Use `form-group` with `label` and `input`
- `mat-icon` → Use `<span class="material-icons">icon_name</span>`
- `mat-table` → Use `table` classes
- `mat-progress-bar` → Use `progress` classes
- `mat-spinner` → Use `spinner` classes
- `mat-checkbox` → Use `checkbox` classes
- `mat-select` → Use native `select` with `input` styling

## 📚 Quick Reference

### **Common Class Combinations**
```html
<!-- Button variations -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-icon"><span class="material-icons">edit</span></button>

<!-- Status indicators -->
<span class="status-success">Success</span>
<span class="status-warning">Warning</span>
<span class="status-danger">Error</span>

<!-- Form elements -->
<input class="input">
<select class="input">
<input type="checkbox" class="checkbox">

<!-- Layout -->
<div class="card">
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div class="flex items-center space-x-4">
```

---

**🎉 You're now ready to build beautiful, consistent components using the Stratos theme system!**

For more examples, check existing converted components in the `/src/frontend/packages/` directory.