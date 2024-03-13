import { Injectable } from '@angular/core';

/**
 * Optional customizations
 */
export interface CustomizationsMetadata {
  hasEula?: boolean;
  copyright?: string;
  logoText?: string;
  appName?: string;
  aboutInfoComponent?: any;
  supportInfoComponent?: any;
  noEndpointsComponent?: any;
  alwaysShowNavForEndpointTypes?: (epType) => boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CustomizationService {

  private customizationMetadata: CustomizationsMetadata = {};

  set = (cm: CustomizationsMetadata) => this.customizationMetadata = cm;
  get = () => this.customizationMetadata;

  setAppNameFromTitle() {
    if (!this.customizationMetadata.appName) {
      this.customizationMetadata.appName = document.title || 'Stratos';
    }
  }
}
