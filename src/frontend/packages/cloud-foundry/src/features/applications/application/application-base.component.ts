
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ApplicationService } from '../application.service';
import { AppDetailDataService } from '../app-detail-data.service';
import { AppLifecycleStateService } from '../app-lifecycle-state.service';
import { ActiveRouteCfOrgSpace } from '../../cf/cf-page.types';
import { CloudFoundryEndpointService } from '../../cf/services/cloud-foundry-endpoint.service';
import { AppApplicationActionsService } from '../../../shared/services/application-actions.service';
import { AppLifecycleProgressService } from '../../../shared/components/app-lifecycle-progress/app-lifecycle-progress.service';

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
    // ApplicationService is the facade shim. Provide as a plain class so
    // Angular's DI handles construction in a proper injection context;
    // the legacy useFactory wrapper triggered NG0201 inside the inject()
    // field initializers under some lifecycle orderings.
    ApplicationService,
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
    // AppLifecycleStateService is the leaf shared-state holder for the
    // "is a write in flight" flag. AppDetailDataService reads it for poll
    // cadence; AppApplicationActionsService writes it. Provided here so
    // both services see the same instance.
    AppLifecycleStateService,
    // AppApplicationActionsService and AppLifecycleProgressService must be
    // provided at THIS level (not a deeper one like application-tabs-base)
    // because AppDetailDataService — also provided here — needs the action
    // service available in the same injector subtree.
    AppApplicationActionsService,
    AppLifecycleProgressService,
    // AppDetailDataService is component-scoped — its signals live for the
    // lifetime of the app-detail subtree only. Providing it here means each
    // navigation to a different app gets a fresh instance and signals from
    // the previous app are torn down cleanly.
    AppDetailDataService,
  ]
})
export class ApplicationBaseComponent implements OnInit {
  private readonly dataService = inject(AppDetailDataService);
  private readonly cfGuid = inject(CF_GUID);
  private readonly appGuid = inject(APP_GUID);

  ngOnInit(): void {
    this.dataService.initialize(this.cfGuid, this.appGuid);
  }
}
