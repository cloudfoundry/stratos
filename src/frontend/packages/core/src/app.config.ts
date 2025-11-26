import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
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
 * This file prepares the application for future migration to standalone bootstrap.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([xsrfInterceptor])
    ),
    // XSRF token extractor service
    { provide: HttpXsrfTokenExtractor, useClass: HttpXsrfHeaderExtractor }
  ]
};
