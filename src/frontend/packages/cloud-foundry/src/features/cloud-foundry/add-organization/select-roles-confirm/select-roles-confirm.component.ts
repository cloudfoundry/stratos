import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UsersRolesSetChanges } from '../../../../actions/users-roles.actions';
import { CFAppState } from '../../../../cf-app-state';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CfRolesService } from '../../users/manage-users/cf-roles.service';
import { UsersRolesModifyComponent } from '../../users/manage-users/manage-users-modify/manage-users-modify.component';
import { AddOrganizationService } from '../add-organization.service';

@Component({
  selector: 'app-select-roles-confirm',
  templateUrl: './select-roles-confirm.component.html',
  styleUrls: ['./select-roles-confirm.component.scss']
})
export class SelectRolesConfirmComponent extends UsersRolesModifyComponent implements OnInit {
  // TODO: RC rename

  store: Store<CFAppState>;
  constructor(
    pstore: Store<CFAppState>,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    componentFactoryResolver: ComponentFactoryResolver,
    cfRolesService: CfRolesService,
    cd: ChangeDetectorRef,
    snackBar: MatSnackBar,
    private addOrgService: AddOrganizationService
  ) {
    super(
      pstore,
      activeRouteCfOrgSpace,
      componentFactoryResolver,
      cfRolesService,
      cd,
      snackBar,
    )
    this.store = pstore;
  }

  ngOnInit() {
  }

  onNext = () => {
    return this.addOrgService. .pipe(
      map(newRoles => {
        return newRoles.map((newRole) => {
          return {

          }
        })
      })
    )

    this.store.dispatch(new UsersRolesSetChanges([]));
    return of({ success: false });
  }
  // this.store.dispatch(new UsersRolesSetChanges(changes));

}
