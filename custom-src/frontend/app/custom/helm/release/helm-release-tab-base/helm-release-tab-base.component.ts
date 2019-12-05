import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { HelmReleaseGuid } from '../../store/helm.types';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';

@Component({
  selector: 'app-helm-release-tab-base',
  templateUrl: './helm-release-tab-base.component.html',
  styleUrls: ['./helm-release-tab-base.component.scss'],
  providers: [
    HelmReleaseHelperService,
    {
      provide: HelmReleaseGuid,
      useFactory: (activatedRoute: ActivatedRoute) => ({
        guid: activatedRoute.snapshot.params.guid
      }),
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
    { link: 'summary', label: 'Summary', icon: 'helm', iconFont: 'stratos-icons' },
    { link: 'notes', label: 'Notes', icon: 'subject' },
    { link: 'values', label: 'Values', icon: 'list' },
    { link: 'pods', label: 'Pods', icon: 'adjust' },
    { link: 'services', label: 'Services', icon: 'service', iconFont: 'stratos-icons' }
  ];
  constructor(
    private helmRelease: HelmReleaseGuid,
  ) {
    const guid = this.helmRelease.guid;
    this.title = guid.split(':')[1];
  }
}
