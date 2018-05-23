import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { CurrentUserPermissions } from '../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/current-user-permissions.service';
import { distinctUntilChanged, startWith } from 'rxjs/operators';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {

  @Input('appUserPermission')
  public appUserPermission: CurrentUserPermissions;

  @Input('appUserPermissionEndpointGuid')
  public appUserPermissionEndpointGuid: string;

  @Input('appUserPermissionOrganizationGuid')
  private appUserPermissionOrganizationGuid: string;

  @Input('appUserPermissionSpaceGuid')
  private appUserPermissionSpaceGuid: string;

  private canSub: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

  public ngOnInit() {
    this.canSub = this.currentUserPermissionsService.can(
      this.appUserPermission,
      this.appUserPermissionEndpointGuid,
      this.getOrgOrSpaceGuid(),
      this.getSpaceGuid()
    ).pipe(
      // Ensure we don't create multiple instances if true is emitted multiple times
      distinctUntilChanged(),
      startWith(false)
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
