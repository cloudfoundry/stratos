import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SetThemeAction } from '../../../store/src/actions/dashboard-actions';
import { DashboardOnlyAppState } from '../../../store/src/app-state';
import { selectDashboardState } from '../../../store/src/selectors/dashboard.selectors';

export interface StratosTheme {
  key: string;
  label: string;
  styleName: string;
}

const coreThemes: StratosTheme[] = [{
  key: 'default',
  label: 'Light',
  styleName: 'default'
}, {
  key: 'dark',
  label: 'Dark',
  styleName: 'dark-theme'
}];

@Injectable()
export class ThemeService {

  constructor(private store: Store<DashboardOnlyAppState>, private overlayContainer: OverlayContainer) { }

  getThemes(): StratosTheme[] {
    return coreThemes;
  }

  getTheme(): Observable<StratosTheme> {
    return this.store.select(selectDashboardState).pipe(
      map(dashboardState => this.findTheme(dashboardState.themeKey))
    );
  }

  setTheme(theme: StratosTheme) {
    this.setOverlay(theme);
    this.store.dispatch(new SetThemeAction(theme));
  }

  /**
   * Initialize the service with a value that already exists in the store
   */
  initialize(themeKey: string) {
    this.setOverlay(this.findTheme(themeKey));
  }

  private findTheme(themeKey: string): StratosTheme {
    const themes = this.getThemes();
    return themes.find(theme => theme.key === themeKey) || themes[0];
  }

  /**
   * Overlays require the theme specifically set, see https://material.angular.io/guide/theming#multiple-themes
   * `Multiple themes and overlay-based components`
   */
  private setOverlay(newTheme: StratosTheme) {
    this.getThemes().forEach(theme => {
      if (newTheme.key === theme.key) {
        this.overlayContainer.getContainerElement().classList.add(theme.styleName);
      } else {
        this.overlayContainer.getContainerElement().classList.remove(theme.styleName);
      }
    });
  }
}
