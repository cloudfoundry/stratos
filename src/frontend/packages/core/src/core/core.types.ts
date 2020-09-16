import { InjectionToken } from '@angular/core';
import { Title } from '@angular/platform-browser';

export const APP_TITLE = new InjectionToken<string>('appTitle');

export const appTitleFactory = (titleService: Title) => {
  return titleService.getTitle();
};
