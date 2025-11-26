import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // Configurable options
  // They can be overriden using assets/js/overrides.js
  backendHostname: string;
  appName: string;
  aboutUrl: string;
  // EO configurable options

  constructor() {
    let overrides: Record<string, unknown> = {};
    // Object.keys(window).find(param => param === 'monocular');
    /* tslint:disable-next-line:no-string-literal */
    const monocular = (window as unknown as { monocular?: { overrides?: Record<string, unknown> } }).monocular;
    if (monocular) {
      overrides = monocular.overrides || {};
    }

    this.backendHostname = (overrides.backendHostname as string) || '/api';
    this.appName = (overrides.appName as string) || 'Monocular';
    this.aboutUrl = (overrides.aboutUrl as string) || 'https://github.com/helm/monocular/blob/master/docs/about.md';
  }
}
