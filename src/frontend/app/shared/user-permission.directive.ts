import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnInit } from '@angular/core';
import { CurrentUserPermissionsService } from '../core/current-user-permissions.service';
import { CurrentUserPermissions } from '../core/current-user-permissions.config';
import { Subscription } from 'rxjs/Subscription';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {

  @Input('appUserPermission')
  private appUserPermission: CurrentUserPermissions;

  @Input('endpointGuid')
  private endpointGuid: string;

  @Input('organizationGuid')
  private organizationGuid: string;

  @Input('spaceGuid')
  private spaceGuid: string;

  private canSub: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

  public ngOnInit() {
    this.canSub = this.currentUserPermissionsService.can(
      this.appUserPermission,
      this.endpointGuid,
      this.getOrgOrSpaceGuid(),
      this.getSpaceGuid()
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
    if (this.spaceGuid && !this.organizationGuid) {
      return this.spaceGuid;
    }
    return this.organizationGuid;
  }

  private getSpaceGuid() {
    if (this.organizationGuid) {
      return this.spaceGuid;
    }
    return null;
  }


}
