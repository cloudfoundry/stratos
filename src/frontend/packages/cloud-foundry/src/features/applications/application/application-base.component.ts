
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ApplicationService } from '../application.service';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';

export function applicationServiceFactory() {
  return new ApplicationService();
}

export function getGuids(type?: string) {
  return (activatedRoute: ActivatedRoute) => {
    const { id, endpointId } = activatedRoute.snapshot.params;
    if (type) {
      return endpointId;
    }
    return id;
  };
}

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule
],
  providers: [
    ApplicationService,
    {
      provide: CF_GUID,
      useFactory: getGuids('cf'),
      deps: [ActivatedRoute]
    },
    {
      provide: APP_GUID,
      useFactory: getGuids(),
      deps: [ActivatedRoute]
    },
    {
      provide: ApplicationService,
      useFactory: applicationServiceFactory,
      deps: []
    },
    // CloudFoundryEndpointService is providedIn:'root' but its constructor
    // calls getEntityService(this.cfGuid) at construction time. The cfGuid
    // comes from ActiveRouteCfOrgSpace, which the root injector only has as
    // an empty `{}` (from CloudFoundryStoreModule). Without a component-
    // level override, any tab whose injector chain falls back to root
    // (Events, Variables, etc.) hits "get action for entity endpoint has
    // no guid" and the page blanks. Provide both at the application-base
    // level so the entire app-detail subtree gets a properly-initialized
    // instance derived from the route's :endpointId param.
    {
      provide: ActiveRouteCfOrgSpace,
      useFactory: (cfGuid: string) => ({ cfGuid }),
      deps: [CF_GUID]
    },
    CloudFoundryEndpointService,
  ]
})
export class ApplicationBaseComponent {
}
