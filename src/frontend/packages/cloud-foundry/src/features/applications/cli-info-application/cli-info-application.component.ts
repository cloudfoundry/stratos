import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { IHeaderBreadcrumb, PageHeaderComponent } from '@stratosui/core';
import { EndpointModel, EndpointsDataService, getFullEndpointApiUrl } from '@stratosui/store';
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
  private endpointsData = inject(EndpointsDataService);


  // Retained for backward compatibility with downstream consumers/tests
  // that still reference the field shape; W36-B Wave 3 stops populating
  // it from the legacy entity-service.
  cfEndpointEntityService: any = null;
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
    // W36-B Wave 3: replace EntityService.waitForEntity$ with the
    // signal-native EndpointsDataService.waitFor() promise. The
    // promise resolves to a raw EndpointModel (no EntityInfo
    // envelope), so the downstream `ep.entity.foo` field access
    // collapses to `ep.foo`.
    const endpoint$ = from(this.endpointsData.waitFor(cfGuid));

    // V3 IApp.entity carries `space_guid` only — the legacy `space`
    // relation (and nested organization) isn't populated by the adapter.
    // Read the wrapped APIResource shapes from the data-service-backed
    // observables instead so we get name fields without relying on
    // inline relations.
    this.context$ = combineLatest(
      this.applicationService.application$,
      this.applicationService.appSpace$,
      this.applicationService.appOrg$,
      endpoint$,
    ).pipe(
      filter(([app, space, org, ep]) => !!app && !!space && !!org && !!ep),
      map(([app, space, org, ep]: [any, any, any, EndpointModel]) => ({
        appName: app.app.entity.name,
        spaceName: space.name,
        orgName: org.name,
        apiEndpoint: getFullEndpointApiUrl(ep),
        username: ep.user ? ep.user.name : ''
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
