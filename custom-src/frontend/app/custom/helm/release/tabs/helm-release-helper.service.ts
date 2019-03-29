import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { PaginationMonitor } from '../../../../shared/monitors/pagination-monitor';
import { GetHelmReleases } from '../../store/helm.actions';
import { helmReleasesSchemaKey } from '../../store/helm.entities';
import { HelmReleaseGuid, HelmRelease } from '../../store/helm.types';
import { AppState } from './../../../../../../store/src/app-state';
import { getPaginationObservables } from './../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class HelmReleaseHelperService {

  public isFetching$: Observable<boolean>;

  public release$: Observable<any>;

  public guid: string;

  public releaseStatus: any;

  constructor(
    helmReleaseGuid: HelmReleaseGuid,
    store: Store<AppState>,
    private httpClient: HttpClient,
  ) {
    this.guid = helmReleaseGuid.guid;

    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(store, action.paginationKey, entityFactory(helmReleasesSchemaKey));
    const svc = getPaginationObservables({store, action, paginationMonitor});
    this.isFetching$ = svc.fetchingEntities$;

    this.release$ = svc.entities$.pipe(
      map((items: HelmRelease[]) => items.find(item => item.guid === this.guid))
    );
  }

  public fetchReleaseStatus(): Observable<any> {
    const title = this.guid.split(':')[1];
    const endpoint = this.guid.split(':')[0];

    // Get helm release
    return this.httpClient.get(`/pp/v1/helm/releases/${endpoint}/${title}`).pipe(
      map((data: any) => this.parseResources(data.info.status.resources))
    );
  }

  private parseResources(res: string) {
    const lines = res.split('\n');
    const result = {
      fields: [],
      data: {}
    };

    // Process
    let i = 0;
    while (i < lines.length) {
      if (lines[i].indexOf('==>') === 0 ) {
        // Got a resource type
        const resType = this.getResourceName(lines[i].substr(4));
        // Read fields
        i++;
        i = this.readFields(result, lines, i);
        i = this.readResType(result, resType, lines, i);
      } else {
        i++;
      }
    }

    this.calculateStats(result);
    this.releaseStatus = result;
    return result;
  }

  private getResourceName(name: string): string {
    const parts = name.trim().split('(');
    return parts[0].trim();
  }

  private readFields(result, lines, i): number {
    let read = result.fields.length === 0;
    if (!read && lines[i].length === 0) {
      i++;
      read = true;
    }

    if (read) {
      const params = lines[i].replace(/  +/g, ' ');
      result.fields = params.split(' ');
      i++;
    }
    return i;
  }

  private readResType(result, resType, lines, i): number {
    const data = result.data;
    data[resType] = [];
    while (i < lines.length) {
      if (lines[i].length === 0) {
        return i + 1;
      }
      let values = lines[i];
      values = values.replace(/  +/g, ' ');
      const value = {};
      values.split(' ').forEach((v, index) => {
        let p = result.fields[index].trim();
        p = p.toLowerCase();
        value[p] = v.trim();
      });
      data[resType].push(value);
      i++;
    }

    return i;
  }

  private calculateStats(res) {
    // Calculate Pod Stats
    if (!!res.data['v1/Pod']) {
      this.calculatePodStats(res, res.data['v1/Pod']);
    }
  }

  private calculatePodStats(data, pods) {
    data.pods = {
      status: {},
      containers: 0,
      ready: 0,
    };

    pods.forEach(pod => {
      let count = data.pods.status[pod.status];
      if (!count) {
        count = 0;
      }
      data.pods.status[pod.status] = count + 1;

      // Parse the ready state if running
      if (pod.status === 'Running') {
        const readyParts = pod.ready.split('/');
        if (readyParts.length === 2) {
          const ready = parseInt(readyParts[0], 10);
          const total = parseInt(readyParts[1], 10);
          data.pods.ready += ready;
          data.pods.containers += total;
        }
      }
    });
  }
}
