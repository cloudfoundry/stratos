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
  styleUrls: ['./cli-info-application.component.scss'],
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

    this.context$ = combineLatest(
      this.applicationService.application$,
      this.cfEndpointEntityService.waitForEntity$
    ).pipe(
      filter(([app, ep]) => !!app && !!ep),
      map(([app, ep]) => {
        const space = app.app.entity.space;
        return {
          appName: app.app.entity.name,
          spaceName: typeof space !== 'string' ? space.entity.name : space,
          orgName: typeof space !== 'string' ? space.entity.organization.entity.name : '',
          apiEndpoint: getFullEndpointApiUrl(ep.entity),
          username: ep.entity.user ? ep.entity.user.name : ''
        };
      }),
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
