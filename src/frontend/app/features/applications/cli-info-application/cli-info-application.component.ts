import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CFAppCLIInfoContext } from '../../../shared/components/cli-info/cli-info.component';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { GetAllEndpoints } from '../../../store/actions/endpoint.actions';
import { endpointSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { getFullEndpointApiUrl } from '../../endpoints/endpoint-helpers';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-cli-info-application',
  templateUrl: './cli-info-application.component.html',
  styleUrls: ['./cli-info-application.component.scss'],
})
export class CliInfoApplicationComponent implements OnInit {

  cfEndpointEntityService: any;
  public previousUrl: string;
  public previousQueryParams: {
    [key: string]: string;
  };

  public context$: Observable<CFAppCLIInfoContext>;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  constructor(
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.breadcrumbs$ = new BehaviorSubject<IHeaderBreadcrumb[]>([]);
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    this.setupObservables(cfGuid);
    this.setupBreadcrumbs(cfGuid, appGuid);
  }

  private setupObservables(cfGuid: string) {
    this.cfEndpointEntityService = this.entityServiceFactory.create(
      endpointSchemaKey,
      entityFactory(endpointSchemaKey),
      cfGuid,
      new GetAllEndpoints(),
      false
    );

    this.context$ = combineLatest(
      this.applicationService.application$,
      this.cfEndpointEntityService.waitForEntity$
    ).pipe(
      filter(([app, ep]) => !!app && !!ep),
      map(([app, ep]) => {
        return {
          appName: app.app.entity.name,
          spaceName: app.app.entity.space.entity.name,
          orgName: app.app.entity.space.entity.organization.entity.name,
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
