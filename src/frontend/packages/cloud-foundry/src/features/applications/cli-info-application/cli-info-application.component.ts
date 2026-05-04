import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { IHeaderBreadcrumb, PageHeaderComponent } from '@stratosui/core';
import { EndpointModel, EntityService, getFullEndpointApiUrl, stratosEntityCatalog } from '@stratosui/store';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { CliCommandComponent } from '../../../shared/components/cli-info/cli-command/cli-command.component';
import { CFAppCLIInfoContext, CliInfoComponent } from '../../../shared/components/cli-info/cli-info.component';

@Component({
  selector: 'app-cli-info-application',
  templateUrl: './cli-info-application.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PageHeaderComponent,
    CliInfoComponent,
    CliCommandComponent
  ]
})
export class CliInfoApplicationComponent implements OnInit {
  private applicationService = inject(ApplicationService);


  cfEndpointEntityService!: EntityService<EndpointModel>;
  public previousUrl!: string;
  public previousQueryParams!: {
    [key: string]: string;
  };

  public context$!: Observable<CFAppCLIInfoContext>;
  public breadcrumbs$!: Observable<IHeaderBreadcrumb[]>;

  constructor() {
    this.breadcrumbs$ = new BehaviorSubject<IHeaderBreadcrumb[]>([]);
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    this.setupObservables(cfGuid);
    this.setupBreadcrumbs(cfGuid, appGuid);
  }

  private setupObservables(cfGuid: string) {
    this.cfEndpointEntityService = stratosEntityCatalog.endpoint.store.getEntityService(cfGuid);

    // V3 IApp.entity carries `space_guid` only — the legacy `space`
    // relation (and nested organization) isn't populated by the adapter.
    // Read the wrapped APIResource shapes from the data-service-backed
    // observables instead so we get name fields without relying on
    // inline relations.
    this.context$ = combineLatest(
      this.applicationService.application$,
      this.applicationService.appSpace$,
      this.applicationService.appOrg$,
      this.cfEndpointEntityService.waitForEntity$
    ).pipe(
      filter(([app, space, org, ep]) => !!app && !!space && !!org && !!ep),
      map(([app, space, org, ep]) => ({
        appName: app.app.entity.name,
        spaceName: space.entity.name,
        orgName: org.entity.name,
        apiEndpoint: getFullEndpointApiUrl(ep.entity),
        username: ep.entity.user ? ep.entity.user.name : ''
      })),
      take(1)
    );
  }

  setupBreadcrumbs(cfGuid: string, appGuid: string) {
    this.breadcrumbs$ = this.context$.pipe(
      map((context) => {
        return [
          {
            breadcrumbs: [
              { value: 'Applications', routerLink: '/applications' },
              { value: context.appName, routerLink: `/applications/${cfGuid}/${appGuid}` }
            ]
          }
        ];
      })
    );
  }
}
