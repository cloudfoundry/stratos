import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, HttpXsrfTokenExtractor } from '@angular/common/http';
import { xsrfInterceptor, HttpXsrfHeaderExtractor } from './xsrf.module';

/**
 * Application configuration for standalone bootstrap
 *
 * This configuration is used when bootstrapping the application in standalone mode.
 * For NgModule-based bootstrap (current setup), HTTP client configuration is still
 * provided through XSRFModule import in AppModule.
 *
 * Note: Zoneless change detection is already configured in AppModule using
 * provideZonelessChangeDetection(). In Angular 21+, zoneless is the default
 * for new applications.
 *
 * This file prepares the application for future migration to standalone bootstrap.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(
      withInterceptors([xsrfInterceptor])
    ),
    // XSRF token extractor service
    { provide: HttpXsrfTokenExtractor, useClass: HttpXsrfHeaderExtractor }
  ]
};
