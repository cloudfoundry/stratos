import { Component } from '@angular/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { HelmReleaseHelperService } from '../helm-release-helper.service';

@Component({
  selector: 'app-helm-release-values-tab',
  templateUrl: './helm-release-values-tab.component.html',
  styleUrls: ['./helm-release-values-tab.component.scss']
})
export class HelmReleaseValuesTabComponent {

  public values$: Observable<any>;

  private viewTypeSubject = new Subject<string>();

  public viewType$: Observable<string>;

  constructor(public helmReleaseHelper: HelmReleaseHelperService) {

    this.viewType$ = this.viewTypeSubject.asObservable().pipe(startWith('user'));

    this.values$ = combineLatest(
      this.viewType$,
      helmReleaseHelper.release$
    ).pipe(
      map(([vtype, release]) => {
        switch (vtype) {
          case 'user':
            return release.config || {};
          case 'combined':
            const chart = release.chart.values || {};
            const user = release.config || {};
            const target = {};
            return this.mergeDeep(target, chart, user);
          default:
            return release.chart.values || {};
        }
      })
    );
  }

  public viewTypeChange(viewType: string) {
    this.viewTypeSubject.next(viewType);
  }

  private isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  private mergeDeep(target, ...sources) {
    if (!sources.length) {
      return target;
    }
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} });
          }
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.mergeDeep(target, ...sources);
  }

}
