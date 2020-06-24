import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { SetThemeAction } from './actions/dashboard-actions';
import { DashboardOnlyAppState } from './app-state';
import { selectDashboardState } from './selectors/dashboard.selectors';
import { StyleService } from './style.service';
import { StratosTheme } from './types/theme.types';

const lightTheme: StratosTheme = {
  key: 'default',
  label: 'Light',
  styleName: 'default'
};
const darkTheme: StratosTheme = {
  key: 'dark',
  label: 'Dark',
  styleName: 'dark-theme'
};
const osTheme: StratosTheme = {
  key: 'os',
  label: 'OS',
  styleName: ''
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {

  private osThemeInfo = {
    supports: false,
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    isLightMode: window.matchMedia('(prefers-color-scheme: light)').matches,
    isNotSpecified: window.matchMedia('(prefers-color-scheme: no-preference)').matches
  };
  private themes: StratosTheme[] = [lightTheme];

  constructor(
    private store: Store<DashboardOnlyAppState>,
    private overlayContainer: OverlayContainer,
    private styleService: StyleService) {
    this.initialiseStratosThemeInfo();
  }

  getThemes(): StratosTheme[] {
    return this.themes;
  }

  getTheme(): Observable<StratosTheme> {
    return this.store.select(selectDashboardState).pipe(
      filter(dashboardState => !!dashboardState),
      map(dashboardState => this.findTheme(dashboardState.themeKey)),
    );
  }

  setTheme(themeKey: string) {
    const findTheme = this.findTheme(themeKey);
    this.setOverlay(findTheme);
    this.store.dispatch(new SetThemeAction(findTheme));
  }

  /**
   * Initialize the service with a theme that may already exists in the store
   */
  initialize() {
    this.getTheme().pipe(first()).subscribe(theme => this.setOverlay(theme));
  }

  private initialiseStratosThemeInfo() {
    const hasDarkTheme = this.styleService.hasSelector('.dark-theme-supported');

    if (hasDarkTheme) {
      this.themes.push(darkTheme);

      this.initialiseOsThemeInfo();
    }

  }

  private initialiseOsThemeInfo() {
    this.osThemeInfo.supports = this.osThemeInfo.isDarkMode || this.osThemeInfo.isLightMode || this.osThemeInfo.isNotSpecified;

    if (this.osThemeInfo.supports) {
      this.themes.push(osTheme);

      // Watch for changes at run time
      window.matchMedia('(prefers-color-scheme: dark)').addListener(e => e.matches && this.updateFollowingOsThemeChange());
      window.matchMedia('(prefers-color-scheme: light)').addListener(e => e.matches && this.updateFollowingOsThemeChange());
      window.matchMedia('(prefers-color-scheme: no-preference)').addListener(e => e.matches && this.updateFollowingOsThemeChange());
    }
  }

  /**
   * Find a theme in a safe way with fall backs
   */
  private findTheme(themeKey: string): StratosTheme {
    if (themeKey === osTheme.key && this.getThemes().find(theme => theme.key === osTheme.key)) {
      return this.getOsTheme() || lightTheme;
    }
    return this.getThemes().find(theme => theme.key === themeKey) || lightTheme;
  }

  /**
   * Create an `OS` theme that contains the relevant style
   */
  private getOsTheme(): StratosTheme {
    if (this.osThemeInfo.supports) {
      return this.osThemeInfo.isDarkMode ? {
        ...osTheme,
        styleName: darkTheme.styleName
      } : this.osThemeInfo.isLightMode || this.osThemeInfo.isNotSpecified ? {
        ...osTheme,
        styleName: lightTheme.styleName
      } : null;
    }
  }

  /**
   * Overlays require the theme specifically set, see https://material.angular.io/guide/theming#multiple-themes
   * `Multiple themes and overlay-based components`
   */
  private setOverlay(newTheme: StratosTheme) {
    // Remove pre-existing styles
    this.getThemes()
      .filter(theme => theme.styleName)
      .forEach(theme => this.overlayContainer.getContainerElement().classList.remove(theme.styleName));
    // Add new style (not from getThemes list, handles OS case)
    this.overlayContainer.getContainerElement().classList.add(newTheme.styleName);
  }

  /**
   * Update theme given changes in OS theme settings
   */
  private updateFollowingOsThemeChange() {
    this.osThemeInfo.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.osThemeInfo.isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
    this.osThemeInfo.isNotSpecified = window.matchMedia('(prefers-color-scheme: no-preference)').matches;

    this.store.select(selectDashboardState).pipe(
      first(),
    ).subscribe(dashboardState => dashboardState.themeKey === osTheme.key && this.setTheme(osTheme.key));
  }
}
