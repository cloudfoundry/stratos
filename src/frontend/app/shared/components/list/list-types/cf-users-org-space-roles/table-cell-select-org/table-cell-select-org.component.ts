import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IOrganization } from '../../../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cloud-foundry/cf-page.types';
import { CfRolesService } from '../../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { UsersRolesSetOrg } from '../../../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../../../store/app-state';
import { selectUsersRolesOrgGuid } from '../../../../../../store/selectors/users-roles.selector';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-select-org',
  templateUrl: './table-cell-select-org.component.html',
  styleUrls: ['./table-cell-select-org.component.scss']
})
export class TableCellSelectOrgComponent extends TableCellCustom<APIResource<IOrganization>> implements OnInit, OnDestroy {

  /**
 * Observable which is populated if only a single org is to be used
 */
  singleOrg$: Observable<APIResource<IOrganization>>;
  organizations$: Observable<APIResource<IOrganization>[]>;
  selectedOrgGuid: string;
  orgGuidChangedSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private cfRolesService: CfRolesService,
  ) { super(); }

  ngOnInit() {
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.singleOrg$ = this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid);
    } else {
      this.singleOrg$ = Observable.of(null);
      this.organizations$ = this.cfRolesService.fetchOrgs(this.activeRouteCfOrgSpace.cfGuid);
    }
    this.orgGuidChangedSub = this.store.select(selectUsersRolesOrgGuid).subscribe(orgGuid => this.selectedOrgGuid = orgGuid);
  }

  ngOnDestroy(): void {
    if (this.orgGuidChangedSub) {
      this.orgGuidChangedSub.unsubscribe();
    }
  }

  updateOrg(orgGuid) {
    if (!orgGuid) {
      return;
    }
    this.store.dispatch(new UsersRolesSetOrg(orgGuid));
  }
}
