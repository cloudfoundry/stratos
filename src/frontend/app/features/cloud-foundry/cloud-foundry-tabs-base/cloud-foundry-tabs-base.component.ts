import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { AppState } from './../../../store/app-state';
import { Store } from '@ngrx/store';
import { SendEventAction } from '../../../store/actions/internal-events.actions';
import { endpointSchemaKey } from '../../../store/helpers/entity-factory';

@Component({
  selector: 'app-cloud-foundry-tabs-base',
  templateUrl: './cloud-foundry-tabs-base.component.html',
  styleUrls: ['./cloud-foundry-tabs-base.component.scss']
})
export class CloudFoundryTabsBaseComponent implements OnInit {
  tabLinks = [
    { link: 'summary', label: 'Summary' },
    { link: 'organizations', label: 'Organizations' },
    { link: 'users', label: 'Users' },
    { link: 'firehose', label: 'Firehose' },
    { link: 'feature-flags', label: 'Feature Flags' },
    { link: 'build-packs', label: 'Build Packs' },
    { link: 'stacks', label: 'Stacks' },
    { link: 'security-groups', label: 'Security Groups' }
  ];

  isFetching$: Observable<boolean>;
  constructor(private cfEndpointService: CloudFoundryEndpointService, private store: Store<AppState>) {
    store.dispatch(new SendEventAction(endpointSchemaKey, cfEndpointService.cfGuid, 'CF Error', '500'));
  }

  ngOnInit() {
    this.isFetching$ = Observable.of(false);
  }
}
