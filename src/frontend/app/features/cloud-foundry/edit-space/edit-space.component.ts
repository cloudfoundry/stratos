import { Component, OnInit } from '@angular/core';
import { CloudFoundrySpaceService } from '../services/cloud-foundry-space.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CfUserService } from '../../../shared/data-services/cf-user.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';

const cfSpaceServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  cfOrgSpaceDataService: CfOrgSpaceDataService,
  cfUserService: CfUserService,
  paginationMonitorFactory: PaginationMonitorFactory,
  cfEndpointService: CloudFoundryEndpointService
) => {
  const { orgId, spaceId } = activatedRoute.snapshot.params;
  const { cfGuid } = cfEndpointService;
  return new CloudFoundrySpaceService(
    cfGuid,
    orgId,
    spaceId,
    store,
    entityServiceFactory,
    cfUserService,
    paginationMonitorFactory,
    cfEndpointService
  );
};


@Component({
  selector: 'app-edit-space',
  templateUrl: './edit-space.component.html',
  styleUrls: ['./edit-space.component.scss'],
  providers: [
    {
      provide: CloudFoundrySpaceService,
      useFactory: cfSpaceServiceFactory,
      deps: [
        Store,
        ActivatedRoute,
        EntityServiceFactory,
        CfOrgSpaceDataService,
        CfUserService,
        PaginationMonitorFactory,
        CloudFoundryEndpointService
      ]
    }
  ]
})
export class EditSpaceComponent implements OnInit {

  spaceName: Observable<string>;
  spaceUrl: string;

  constructor(private cfSpaceService: CloudFoundrySpaceService) {

    this.spaceUrl = '/cloud-foundry/' +
      `${cfSpaceService.cfGuid}/organizations/` +
      `${cfSpaceService.orgGuid}/spaces/` +
      `${cfSpaceService.spaceGuid}/summary`;
    this.spaceName = cfSpaceService.space$.pipe(
      map(s => s.entity.entity.name)
    );
  }

  ngOnInit() {
  }

}
