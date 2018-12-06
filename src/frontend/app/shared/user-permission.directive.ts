import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { CurrentUserPermissions } from '../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/current-user-permissions.service';
import { waitForCFPermissions } from '../features/cloud-foundry/cf.helpers';
import { AppState } from '../store/app-state';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {

  @Input()
  public appUserPermission: CurrentUserPermissions;

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
