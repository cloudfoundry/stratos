import { Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input } from '@angular/core';

import { CurrentUserPermissionsService } from '@stratosui/core';
import { CfCurrentUserPermissions, CfCurrentUserRolesDataService } from '@stratosui/cloud-foundry';

@Directive({
  selector: '[appCfUserPermission]',
  standalone: true
})
export class CfUserPermissionDirective {
  private rolesData = inject(CfCurrentUserRolesDataService);
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);

  // The structural directive's own expression; every use names the permission.
  public readonly appCfUserPermission = input.required<CfCurrentUserPermissions>();

  public readonly appCfUserPermissionEndpointGuid = input<string>();

  protected readonly appCfUserPermissionOrganizationGuid = input<string>();

  protected readonly appCfUserPermissionSpaceGuid = input<string>();

  // True once the endpoint's roles have loaded (at once without an endpoint).
  private readonly ready = computed(() => {
    const endpointGuid = this.appCfUserPermissionEndpointGuid();
    return !endpointGuid || !!this.rolesData.cfRolesState()?.[endpointGuid]?.state.initialised;
  });
  private readonly check = computed(() => this.currentUserPermissionsService.can(
    this.appCfUserPermission(),
    this.appCfUserPermissionEndpointGuid(),
    this.getOrgOrSpaceGuid(),
    this.getSpaceGuid()
  ));
  private hasView = false;

  constructor() {
    effect(() => {
      const can = this.ready() && this.check()();
      if (can && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!can && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
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
