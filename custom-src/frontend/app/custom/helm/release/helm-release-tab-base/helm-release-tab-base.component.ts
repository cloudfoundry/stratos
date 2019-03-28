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
    console.log(res);

    const lines = res.split('\n');
    console.log(lines);
    const result = {
      fields: [],
      data: {}
    };

    // Process
    let i = 0;
    while (i < lines.length) {
      console.log('Looking for resource');
      console.log(i);
      console.log(lines[i]);
      if (lines[i].indexOf('==>') === 0 ) {
        // Got a resource type
        const resType = lines[i].substr(4).trim();
        // Read fields
        i++;
        i = this.readFields(result, lines, i);
        i = this.readResType(result, resType, lines, i);
      } else {
        i++;
      }
    }

    console.log('done');

    console.log(result);
  }

  private readFields(result, lines, i): number {
    console.log('Read fields: ' + i + ' ' + lines[i]);
    let read = result.fields.length === 0;

    if (!read && lines[i].length === 0) {
      i++;
      read = true;
    }

    if (read) {
      const params = lines[i].replace(/  +/g, ' ');
      result.fields = params.split(' ');
      i++;
      console.log('read fields: ' + result.fields.join(', '));
    }

    console.log('Read fields done: ' + i + ' ' + lines[i]);

    return i;
  }


  private readResType(result, resType, lines, i): number {

    const data = result.data;

    console.log('-----');
    console.log('read: ' + i);
    data[resType] = [];
    while (i < lines.length) {
      console.log( i + ' ' + lines[i]);
      if (lines[i].length === 0) {
        console.log('Done: ' + i);
        return i + 1;
      }
      let values = lines[i];
      values = values.replace(/  +/g, ' ');
      console.log(values);
      const value = {};
      values.split(' ').forEach((v, index) => {
        let p = result.fields[index].trim();
        p = p.toLowerCase();
        value[p] = v.trim();
      });
      data[resType].push(value);
      i++;
    }

    console.log('read done: ' + i);

    return i;
  }
}
