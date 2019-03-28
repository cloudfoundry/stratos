import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationMonitor } from '../../../../shared/monitors/pagination-monitor';
import { GetHelmReleases } from '../../store/helm.actions';
import { helmReleasesSchemaKey } from '../../store/helm.entities';
import { HelmReleaseGuid } from '../../store/helm.types';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';
import { HttpClient } from '@angular/common/http';
import { equalParamsAndUrlSegments } from '@angular/router/src/router_state';

@Component({
  selector: 'app-helm-release-tab-base',
  templateUrl: './helm-release-tab-base.component.html',
  styleUrls: ['./helm-release-tab-base.component.scss'],
  providers: [
    HelmReleaseHelperService,
    {
      provide: HelmReleaseGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.guid
        };
      },
      deps: [
        ActivatedRoute
      ]
    }
  ]
})
export class HelmReleaseTabBaseComponent {

  isFetching$: Observable<boolean>;

  public breadcrumbs = [{
    breadcrumbs: [
    { value: 'Helm', routerLink: '/monocular' },
    { value: 'Releases', routerLink: '/monocular/releases' }
  ]
}];

  public title = '';

  tabLinks = [
    { link: 'summary', label: 'Summary', matIcon: 'helm', matIconFont: 'stratos-icons' },
    { link: 'notes', label: 'Notes', matIcon: 'subject' },
  ];
  constructor(
    private helmRelease: HelmReleaseGuid,
    private httpClient: HttpClient,
  ) {
    const guid = this.helmRelease.guid;
    this.title = guid.split(':')[1];

    const endpoint = guid.split(':')[0];

    // Get helm release
    httpClient.get(`/pp/v1/helm/releases/${endpoint}/${this.title}`).subscribe((data: any) => {
      console.log('Got release detail');
      console.log(data);
      this.parseResources(data.info.status.resources);
    });
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

    console.log('done');
    console.log(result);
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
      //if (pod.)

    });



  }
}
