import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { PermissionTypes } from '../core/permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/permissions/current-user-permissions.service';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {
  @Input()
  public appUserPermission: PermissionTypes;

  @Input()
  public appUserPermissionEndpointGuid: string;

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
    ).subscribe(can => {
      if (can) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }

  public ngOnDestroy() {
    if (this.canSub) {
      this.canSub.unsubscribe();
    }
  }

}
