import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { SendEventAction } from '../../../store/actions/internal-events.actions';
import { endpointSchemaKey } from '../../../store/helpers/entity-factory';
import { InternalEventServerity } from '../../../store/types/internal-events.types';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { PageHeaderNotice } from './../../../shared/components/page-header/page-header.types';
import { SendClearEventAction } from './../../../store/actions/internal-events.actions';
import { AppState } from './../../../store/app-state';
import { internalEventCodeSelector } from './../../../store/selectors/internal-events.selectors';

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

  // Used to hide tab that is not yet implemented when in production
  isDevEnvironment = !environment.production;

  isFetching$: Observable<boolean>;
  public notice$: Observable<PageHeaderNotice>;

  constructor(public cfEndpointService: CloudFoundryEndpointService, private store: Store<AppState>) {
    store.dispatch(new SendEventAction(endpointSchemaKey, cfEndpointService.cfGuid, 'CF Error', '500', InternalEventServerity.ERROR));
    store.dispatch(new SendEventAction(endpointSchemaKey, cfEndpointService.cfGuid, 'CF Error', '600', InternalEventServerity.ERROR));
    store.dispatch(new SendEventAction(endpointSchemaKey, cfEndpointService.cfGuid, 'CF Error', '1200', InternalEventServerity.ERROR));
    this.notice$ = this.store.select(internalEventCodeSelector(endpointSchemaKey, cfEndpointService.cfGuid, ['500'])).pipe(
      map(state => state[0])
    );
    setTimeout(() => {
      store.dispatch(new SendClearEventAction(endpointSchemaKey, cfEndpointService.cfGuid, {
        eventCode: '500'
      }));
    }, 4000);
  }

  ngOnInit() {
    this.isFetching$ = Observable.of(false);
  }
}
