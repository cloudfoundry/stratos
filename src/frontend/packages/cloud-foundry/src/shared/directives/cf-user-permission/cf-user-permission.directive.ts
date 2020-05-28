import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { AppState } from '../../../../../store/src/app-state';
import { waitForCFPermissions } from '../../../features/cloud-foundry/cf.helpers';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';

@Directive({
  selector: '[appCfUserPermission]'
})
export class CfUserPermissionDirective implements OnDestroy, OnInit {
  @Input()
  public appCfUserPermission: CfCurrentUserPermissions;

  @Input()
  public appCfUserPermissionEndpointGuid: string;

  @Input()
  private appCfUserPermissionOrganizationGuid: string;

  @Input()
  private appCfUserPermissionSpaceGuid: string;

  private canSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

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
    return endpointGuid && endpointGuid.length > 0 ? waitForCFPermissions(this.store, endpointGuid) : observableOf(true);
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
