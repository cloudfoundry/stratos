import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {
  // Configurable options
  // They can be overriden using assets/js/overrides.js
  backendHostname: string;
  appName: string;
  aboutUrl: string;
  // EO configurable options

  constructor() {
    let overrides: any = {};
    // Object.keys(window).find(param => param === 'monocular');
    /* tslint:disable-next-line:no-string-literal */
    const monocular = window['monocular'];
    if (monocular) {
      overrides = monocular.overrides || {};
    }

    this.backendHostname = overrides.backendHostname || '/api';
    this.appName = overrides.appName || 'Monocular';
    this.aboutUrl = overrides.aboutUrl || 'https://github.com/helm/monocular/blob/master/docs/about.md';
  }
}
