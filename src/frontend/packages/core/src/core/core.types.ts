import { HttpHeaders, HttpParams } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { Title } from '@angular/platform-browser';

export const APP_TITLE = new InjectionToken<string>('appTitle');

export const appTitleFactory = (titleService: Title) => {
  return titleService.getTitle();
};

export class HttpOptions {
  headers?: HttpHeaders | {
    [header: string]: string | string[];
  };
  // observe?: 'response';
  params?: HttpParams | {
    [param: string]: string | string[];
  };
  reportProgress?: boolean;
  // responseType?: 'json';
  withCredentials?: boolean;
};
