/**
 * NgX-Charts compatibility shim for Angular 20+
 * This provides the ɵɵariaProperty function that was removed in Angular 20
 * but is still used by @swimlane/ngx-charts
 */

import * as i0 from '@angular/core';

// Extend Angular core module with the missing ɵɵariaProperty function
if (!(i0 as any).ɵɵariaProperty) {
  (i0 as any).ɵɵariaProperty = function(property: string, value: any): void {
    // Simplified polyfill - just do nothing to prevent errors
    // In a real implementation, this would set aria attributes on the current element
    // console.warn(`ɵɵariaProperty polyfill: ${property} = ${value}`);
  };
}

// Export for use if needed
export const ɵɵariaProperty = (i0 as any).ɵɵariaProperty;