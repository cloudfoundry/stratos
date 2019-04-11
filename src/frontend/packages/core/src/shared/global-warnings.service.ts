import { AppState } from './../../../store/src/app-state';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, ReplaySubject } from 'rxjs';
import { Store } from '@ngrx/store';
import { map, publishReplay, refCount, tap, startWith } from 'rxjs/operators';

export interface IGlobalWarningConfig {
  isWarning: (state: AppState) => boolean;
  message: ((state: AppState) => string) | string;
  link: ((state: AppState) => string) | string;
  type?: string;
}

export interface IGlobalWarning {
  message: string;
  link: string;
  type?: string;
}
@Injectable({
  providedIn: 'root'
})
export class GlobalWarningsService {
  private warningsConfigs: IGlobalWarningConfig[] = [];
  private warningsConfigsSubject = new ReplaySubject<IGlobalWarningConfig[]>();

  public warnings$: Observable<IGlobalWarning[]>;

  public addWarning(warning: IGlobalWarningConfig) {
    console.log('here - warning')
    this.warningsConfigs.push(warning);
    this.warningsConfigsSubject.next(this.warningsConfigs);
  }

  constructor(store: Store<AppState>) {
    this.warnings$ = combineLatest(
      this.warningsConfigsSubject.asObservable().pipe(
        startWith(this.warningsConfigs)
      ),
      store
    ).pipe(
      map(([configs, appState]) => {
        console.log(configs)
        return configs.reduce((warnings, config) => {
          if (config.isWarning(appState)) {
            const message = typeof config.message === 'function' ? config.message(appState) : config.message;
            const link = typeof config.link === 'function' ? config.link(appState) : config.link;
            warnings.push({
              message,
              link,
              type: config.type
            });
          }
          console.log(warnings)
          return warnings;
        }, [] as IGlobalWarning[]);
      }),
      publishReplay(1),
      refCount(),
    );
  }
}
