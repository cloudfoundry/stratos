/**
 * NgX-Charts compatibility shim for Angular 20+
 * This provides the ɵɵariaProperty function that was removed in Angular 20
 * but is still used by @swimlane/ngx-charts
 */

import * as AngularCore from '@angular/core';

// Polyfill function that does nothing but prevents errors
function ɵɵariaPropertyPolyfill(property: string, value: any): void {
  // This is a no-op polyfill to prevent ngx-charts from crashing
  // In real Angular apps, this would set aria attributes on the current element
  // but for our compatibility purposes, we just ignore the calls
}

// Patch the Angular Core module by adding the missing export
(AngularCore as any).ɵɵariaProperty = ɵɵariaPropertyPolyfill;

// Export the polyfill function
export const ɵɵariaProperty = ɵɵariaPropertyPolyfill;