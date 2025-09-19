/*
 * Public API Surface of core
 */

// export * from './app.module';

// Extensions
export * from './core/extension/extension-service';

// Customization
export * from './core/customizations.types';

// Modules
export * from './core/core.module';
export * from './core/md.module';
export * from './shared/shared.module';

// LoginPageComponent
export { LoginPageComponent } from './features/login/login-page/login-page.component';

export { ProfileSettingsTypes } from './shared/components/profile-settings/profile-settings.component';

// Tailwind Material Replacements
export * from './shared/services/tailwind-material-replacements';
export * from './shared/services/tailwind-snackbar.service';
export * from './shared/services/tailwind-dialog.service';
export * from './shared/services/tailwind-sidenav.service';
export * from './shared/services/tailwind-sort.service';
export * from './shared/services/tailwind-paginator.service';
export * from './shared/services/tailwind-json-schema-form.service';
export * from './shared/services/tailwind-icon-registry.service';
