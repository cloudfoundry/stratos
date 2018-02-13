import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfUserService } from '../../../../../data-services/cf-user.service';
import { UserRoleInOrg } from '../../../../../../store/types/user.types';
import { CloudFoundryEndpointService } from '../../../../../../features/cloud-foundry/cloud-foundry-base/cloud-foundry-endpoint.service';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { EndpointUser } from '../../../../../../store/types/endpoint.types';
import { getOrgRolesString } from '../../../../../../features/cloud-foundry/cf.helpers';
@Component({
  selector: 'app-cf-org-card',
  templateUrl: './cf-org-card.component.html',
  styleUrls: ['./cf-org-card.component.scss']
})
export class CfOrgCardComponent extends TableCellCustom<APIResource>
  implements OnInit, OnDestroy {
  userRolesInOrg$: Observable<string>;
  currentUser$: Observable<EndpointUser>;
  @Input('row') row;

  constructor(
    private cfUserService: CfUserService,
    private cfEndpointService: CloudFoundryEndpointService
  ) {
    super();
  }

  ngOnInit() {
    console.log(this.row);
    this.currentUser$ = this.cfEndpointService.endpoint$.pipe(
      map(e => e.entity.user)
    );

    this.userRolesInOrg$ = this.currentUser$.pipe(
      switchMap(u => {
        return this.cfUserService.getUserRoleInOrg(
          u.guid,
          this.row.entity.guid,
          this.row.entity.cfGuid
        );
      }),
      map(u => getOrgRolesString(u))
    );

    // this.appsCount = this.
  }

  ngOnDestroy(): void {}
}
