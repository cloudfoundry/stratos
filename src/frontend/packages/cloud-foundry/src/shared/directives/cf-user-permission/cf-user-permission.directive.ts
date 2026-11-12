import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef, computed, effect, inject, input, signal } from '@angular/core';
import { Observable, of as observableOf, Subscription } from 'rxjs';

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

  // True once the endpoint's roles have loaded (at once without an endpoint).
  private readonly ready = signal(false);
  private readonly check = computed(() => this.currentUserPermissionsService.can(
    this.appCfUserPermission(),
    this.appCfUserPermissionEndpointGuid(),
    this.getOrgOrSpaceGuid(),
    this.getSpaceGuid()
  ));
  private hasView = false;
  private readySub?: Subscription;

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

  public ngOnInit() {
    this.readySub = this.waitForEndpointPermissions(this.appCfUserPermissionEndpointGuid())
      .subscribe(() => this.ready.set(true));
  }

  private waitForEndpointPermissions(endpointGuid?: string): Observable<any> {
    return endpointGuid && endpointGuid.length > 0 ? waitForCFPermissions(this.cfRoles, endpointGuid) : observableOf(true);
  }

  public ngOnDestroy() {
    this.readySub?.unsubscribe();
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
