import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { getFullEndpointApiUrl } from '../../../../../store/src/endpoint-utils';
import { EntityService } from '../../../../../store/src/entity-service';
import { stratosEntityCatalog } from '../../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { CFAppCLIInfoContext } from '../../../shared/components/cli-info/cli-info.component';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-cli-info-application',
  templateUrl: './cli-info-application.component.html',
  styleUrls: ['./cli-info-application.component.scss'],
})
export class CliInfoApplicationComponent implements OnInit {

  cfEndpointEntityService: EntityService<EndpointModel>;
  public previousUrl: string;
  public previousQueryParams: {
    [key: string]: string;
  };

  public context$: Observable<CFAppCLIInfoContext>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  constructor(
    private applicationService: ApplicationService,
  ) {
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
      first()
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
