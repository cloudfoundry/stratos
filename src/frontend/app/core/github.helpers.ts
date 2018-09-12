import { InjectionToken } from '@angular/core';

export const GITHUB_API_URL = new InjectionToken<string>('GITHUB_API_URL');

export function getGitHubAPIURL(): string {
  const override = window.sessionStorage.getItem('STRATOS_GITHUB_API_URL');
  return override ? override : 'https://api.github.com';
}
