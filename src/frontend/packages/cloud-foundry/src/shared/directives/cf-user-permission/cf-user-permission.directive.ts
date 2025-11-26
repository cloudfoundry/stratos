import { Directive, Input, type OnDestroy, type OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf, type Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '@stratosui/core';
import type { AppState, GeneralEntityAppState } from '@stratosui/store';
import { type CfCurrentUserPermissions, waitForCFPermissions } from '@stratosui/cloud-foundry';
import type { ICfRolesState } from '../../../store/types/cf-current-user-roles.types';

@Directive({
  selector: '[appCfUserPermission]',
  standalone: true
})
export class CfUserPermissionDirective implements OnDestroy, OnInit {
  @Input()
  public appCfUserPermission!: CfCurrentUserPermissions;

  @Input()
  public appCfUserPermissionEndpointGuid!: string;

  @Input()
  private appCfUserPermissionOrganizationGuid!: string;

  @Input()
  private appCfUserPermissionSpaceGuid!: string;

  private canSub!: Subscription;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private templateRef: TemplateRef<unknown>,
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

  private waitForEndpointPermissions(endpointGuid: string): Observable<boolean | ICfRolesState> {
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
