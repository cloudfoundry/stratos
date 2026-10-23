import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef, inject, input } from '@angular/core';
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

  // The structural directive's own expression; every use names the permission.
  public readonly appCfUserPermission = input.required<CfCurrentUserPermissions>();

  public readonly appCfUserPermissionEndpointGuid = input<string>();

  protected readonly appCfUserPermissionOrganizationGuid = input<string>();

  protected readonly appCfUserPermissionSpaceGuid = input<string>();

  private canSub!: Subscription;

  public ngOnInit() {
    this.canSub = this.waitForEndpointPermissions(this.appCfUserPermissionEndpointGuid()).pipe(
      switchMap(() => this.currentUserPermissionsService.can(
        this.appCfUserPermission(),
        this.appCfUserPermissionEndpointGuid(),
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

  private waitForEndpointPermissions(endpointGuid?: string): Observable<any> {
    return endpointGuid && endpointGuid.length > 0 ? waitForCFPermissions(this.cfRoles, endpointGuid) : observableOf(true);
  }

  public ngOnDestroy() {
    if (this.canSub) {
      this.canSub.unsubscribe();
    }
  }

  private getOrgOrSpaceGuid() {
    const appCfUserPermissionSpaceGuid = this.appCfUserPermissionSpaceGuid();
    const appCfUserPermissionOrganizationGuid = this.appCfUserPermissionOrganizationGuid();
    if (appCfUserPermissionSpaceGuid && !appCfUserPermissionOrganizationGuid) {
      return appCfUserPermissionSpaceGuid;
    }
    return appCfUserPermissionOrganizationGuid;
  }

  private getSpaceGuid() {
    if (this.appCfUserPermissionOrganizationGuid()) {
      return this.appCfUserPermissionSpaceGuid();
    }
    return null;
  }


}
