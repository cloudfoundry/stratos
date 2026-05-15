import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { CfCurrentUserPermissions, CfCurrentUserRolesSignalService, waitForCFPermissions } from '@stratosui/cloud-foundry';

@Directive({
  selector: '[appCfUserPermission]',
  standalone: true
})
export class CfUserPermissionDirective implements OnDestroy, OnInit {
  private cfRoles = inject(CfCurrentUserRolesSignalService);
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);

  @Input()
  public appCfUserPermission!: CfCurrentUserPermissions;

  @Input()
  public appCfUserPermissionEndpointGuid!: string;

  @Input()
  private appCfUserPermissionOrganizationGuid!: string;

  @Input()
  private appCfUserPermissionSpaceGuid!: string;

  private canSub!: Subscription;

  public ngOnInit() {
    this.canSub = this.waitForEndpointPermissions(this.appCfUserPermissionEndpointGuid).pipe(
      switchMap(() => this.currentUserPermissionsService.can(
        this.appCfUserPermission,
        this.appCfUserPermissionEndpointGuid,
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
    return endpointGuid && endpointGuid.length > 0 ? waitForCFPermissions(this.cfRoles, endpointGuid) : observableOf(true);
  }

  public ngOnDestroy() {
    if (this.canSub) {
      this.canSub.unsubscribe();
    }
  }

  private getOrgOrSpaceGuid() {
    if (this.appCfUserPermissionSpaceGuid && !this.appCfUserPermissionOrganizationGuid) {
      return this.appCfUserPermissionSpaceGuid;
    }
    return this.appCfUserPermissionOrganizationGuid;
  }

  private getSpaceGuid() {
    if (this.appCfUserPermissionOrganizationGuid) {
      return this.appCfUserPermissionSpaceGuid;
    }
    return null;
  }


}
