import { CommonModule, AsyncPipe } from '@angular/common';
import {Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageSubNavComponent } from '../../../../../../../core/src/shared/components/page-sub-nav/page-sub-nav.component';
import { JsonViewerComponent } from '../../../../../../../core/src/shared/components/json-viewer/json-viewer.component';
import { NoContentMessageComponent } from '../../../../../../../core/src/shared/components/no-content-message/no-content-message.component';

import { HelmReleaseHelperService } from '../helm-release-helper.service';
import type { HelmRelease } from '../../../workload.types';

@Component({
  selector: 'app-helm-release-values-tab',
  templateUrl: './helm-release-values-tab.component.html',
  styleUrls: ['./helm-release-values-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PageSubNavComponent,
    JsonViewerComponent,
    NoContentMessageComponent
  ]
})
export class HelmReleaseValuesTabComponent {

  public values$: Observable<Record<string, unknown>>;

  private viewType = signal<string>('user');
  public viewType$ = toObservable(this.viewType);  public helmReleaseHelper = inject(HelmReleaseHelperService);



  constructor() {


    this.values$ = combineLatest([
      this.viewType$,
      this.helmReleaseHelper.release$
    ]).pipe(
      map(([vtype, release]: [string, HelmRelease]) => {
        switch (vtype) {
          case 'user':
            return release.config || {};
          case 'combined': {
            const chart = release.chart.values || {};
            const user = release.config || {};
            const target = {};
            return this.mergeDeep(target, chart, user);
          }
          default:
            return release.chart.values || {};
        }
      })
    );


  }

  public viewTypeChange(viewType: string) {
    this.viewType.set(viewType);
  }

  private isObject(item: unknown): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  private mergeDeep(target: Record<string, unknown>, ...sources: Record<string, unknown>[]): Record<string, unknown> {
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
          this.mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.mergeDeep(target, ...sources);
  }

}
