import { CommonModule } from '@angular/common';
import { CustomFormFieldComponent, MatInputDirective } from '@stratosui/core';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { UsersRolesSetOrg } from '../../../../../../../../cloud-foundry/src/actions/users-roles.actions';
import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IOrganization } from '../../../../../../cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../../features/cf/cf-page.types';
import { CfRolesService } from '../../../../../../features/cf/users/manage-users/cf-roles.service';
import { selectCfUsersRolesOrgGuid } from '../../../../../../store/selectors/cf-users-roles.selector';

@Component({
  selector: 'app-table-cell-select-org',
  templateUrl: './table-cell-select-org.component.html',
  styleUrls: ['./table-cell-select-org.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
  ]
})
export class TableCellSelectOrgComponent extends TableCellCustom<APIResource<IOrganization>> implements OnInit, OnDestroy {
  private store = inject<Store<CFAppState>>(Store);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfRolesService = inject(CfRolesService);


  /**
   * Observable which is populated if only a single org is to be used
   */
  singleOrg$: Observable<APIResource<IOrganization>>;
  organizations$: Observable<APIResource<IOrganization>[]>;
  selectedOrgGuid: string;
  orgGuidChangedSub: Subscription;

  ngOnInit() {
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.singleOrg$ = this.cfRolesService.fetchOrgEntity(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid);
    } else {
      this.organizations$ = this.cfRolesService.fetchOrgs(this.activeRouteCfOrgSpace.cfGuid);
      this.singleOrg$ = this.organizations$.pipe(
        // Also count as single org when there's only one org in the list (due to only one org... only one permissable org to edit, etc)
        map(orgs => orgs && orgs.length === 1 ? orgs[0] : null)
      );
    }
    this.orgGuidChangedSub = this.store.select(selectCfUsersRolesOrgGuid).subscribe(orgGuid => {
      this.selectedOrgGuid = orgGuid;
    });
  }

  ngOnDestroy(): void {
    if (this.orgGuidChangedSub) {
      this.orgGuidChangedSub.unsubscribe();
    }
  }

  updateOrg(orgGuid: string) {
    if (!orgGuid) {
      return;
    }
    this.organizations$.pipe(take(1)).subscribe(orgs => {
      const org = orgs.find(o => o.metadata.guid === orgGuid);
      this.store.dispatch(new UsersRolesSetOrg(org.metadata.guid, org.entity.name));
    });

  }
}
