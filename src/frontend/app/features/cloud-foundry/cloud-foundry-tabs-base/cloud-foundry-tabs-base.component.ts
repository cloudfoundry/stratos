import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { CloudFoundryEndpointService } from '../cloud-foundry-base/cloud-foundry-endpoint.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'organizations', label: 'Organizations' },
    { link: 'users', label: 'users' },
    { link: 'firehose', label: 'Firehose' },
    { link: 'feature-flags', label: 'Feature Flags' },
    { link: 'build-packs', label: 'Build Packs' },
    { link: 'stacks', label: 'Stacks' },
    { link: 'security-groups', label: 'Security Groups' }
  ];

  isFetching$: Observable<boolean>;
  constructor(private cfEndpointService: CloudFoundryEndpointService) {}

  ngOnInit() {
    this.isFetching$ = Observable.of(false);
    this.cfEndpointService.endpoint$
      .pipe(
        tap(p => {
          console.log(p);
        })
      )
      .subscribe();
  }
}
