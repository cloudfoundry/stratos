import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { PaginationMonitor } from '../../../../../../store/src/monitors/pagination-monitor';
import { helmEntityFactory, helmReleaseEntityKey } from '../../helm-entity-factory';
import { GetHelmReleases, GetHelmReleaseStatus } from '../../store/helm.actions';
import { HelmRelease, HelmReleaseGuid, HelmReleaseStatus } from '../../store/helm.types';
import { AppState } from './../../../../../../store/src/app-state';
import {
  getPaginationObservables,
} from './../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';

@Injectable()
export class HelmReleaseHelperService {

  public isFetching$: Observable<boolean>;

  public release$: Observable<HelmRelease>;

  public guid: string;
  public endpointGuid: string;
  public releaseTitle: string;

  constructor(
    helmReleaseGuid: HelmReleaseGuid,
    store: Store<AppState>,
    private esf: EntityServiceFactory
  ) {
    this.guid = helmReleaseGuid.guid;
    this.releaseTitle = this.guid.split(':')[1];
    this.endpointGuid = this.guid.split(':')[0];

    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(store, action.paginationKey, helmEntityFactory(helmReleaseEntityKey));
    const svc = getPaginationObservables({ store, action, paginationMonitor });
    this.isFetching$ = svc.fetchingEntities$;

    this.release$ = svc.entities$.pipe(
      map((items: HelmRelease[]) => items.find(item => item.guid === this.guid))
    );
  }

  public fetchReleaseStatus(): Observable<HelmReleaseStatus> {
    // Get helm release
    const action = new GetHelmReleaseStatus(this.endpointGuid, this.releaseTitle);

    return this.esf.create<HelmReleaseStatus>(action.key, action).waitForEntity$.pipe(
      map(entity => entity.entity)
    );
  }
}

export const parseHelmReleaseStatus = (res: string): HelmReleaseStatus => {
  const lines = res.split('\n');
  const result = {
    pods: {},
    fields: [],
    data: {
      'v1/Pod': {},
      'v1/Service': {}
    }
  };

  // Process
  let i = 0;
  while (i < lines.length) {
    if (lines[i].indexOf('==>') === 0) {
      // Got a resource type
      const resType = getResourceName(lines[i].substr(4));
      // Read fields
      i++;
      i = readFields(result, lines, i);
      i = readResType(result, resType, lines, i);
    } else {
      i++;
    }
  }

  calculateStats(result);
  return result;
};

function getResourceName(name: string): string {
  const parts = name.trim().split('(');
  return parts[0].trim();
}

function readFields(result, lines, i): number {
  let read = result.fields.length === 0;
  if (!read && lines[i].length === 0) {
    i++;
    read = true;
  }

  if (lines[i].indexOf('NAME') === 0) {
    read = true;
  }

  if (read) {
    const params = lines[i].replace(/  +/g, ' ');
    result.fields = params.split(' ');
    i++;
  }
  return i;
}

function readResType(result, resType, lines, i): number {
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

function calculateStats(res) {
  // Calculate Pod Stats
  if (!!res.data['v1/Pod']) {
    calculatePodStats(res, res.data['v1/Pod']);
  }
}

function calculatePodStats(data, pods) {
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
