import { InjectionToken } from '@angular/core';

/**
 * Optional customizations
 */
export interface CustomizationsMetadata {
  hasEula?: boolean;
  copyright?: string;
  logoText?: string;
  aboutInfoComponent?: any;
  supportInfoComponent?: any;
  alwaysShowNavForEndpointTypes?: (epType) => boolean;
}

export const Customizations = new InjectionToken<CustomizationsMetadata>('Stratos customizations');
