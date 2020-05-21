import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { waitForCFPermissions } from '../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { CfCurrentUserPermissions } from '../../../cloud-foundry/src/user-permissions/cf-user-permissions-checkers';
import { AppState } from '../../../store/src/app-state';
import { CurrentUserPermissionsService } from '../core/current-user-permissions.service';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {
  // TODO: move
  @Input()
  public appUserPermission: CfCurrentUserPermissions;

  @Input()
  public appUserPermissionEndpointGuid: string;

  @Input()
  private appUserPermissionOrganizationGuid: string;

  @Input()
  private appUserPermissionSpaceGuid: string;

  private canSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

  public ngOnInit() {
    this.canSub = this.waitForEndpointPermissions(this.appUserPermissionEndpointGuid).pipe(
      switchMap(() => this.currentUserPermissionsService.can(
        this.appUserPermission,
        this.appUserPermissionEndpointGuid,
        this.getOrgOrSpaceGuid(),
        this.getSpaceGuid()
      ))
    ).subscribe(
      can => {
        if (can) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
          this.viewContainer.clear();
        }
      }
    );
  }

  private waitForEndpointPermissions(endpointGuid: string): Observable<any> {
    return endpointGuid && endpointGuid.length > 0 ? waitForCFPermissions(this.store, endpointGuid) : observableOf(true);
  }

  public ngOnDestroy() {
    if (this.canSub) {
      this.canSub.unsubscribe();
    }
  }

  private getOrgOrSpaceGuid() {
    if (this.appUserPermissionSpaceGuid && !this.appUserPermissionOrganizationGuid) {
      return this.appUserPermissionSpaceGuid;
    }
    return this.appUserPermissionOrganizationGuid;
  }

  private getSpaceGuid() {
    if (this.appUserPermissionOrganizationGuid) {
      return this.appUserPermissionSpaceGuid;
    }
    return null;
  }


}
