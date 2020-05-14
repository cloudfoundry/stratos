import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AppState } from '../../../../store/src/app-state';
import { CFUserPermissions } from '../../cf-user-permissions.config';
import { CFUserPermissionsService } from '../../cf-user-permissions.service';
import { waitForCFPermissions } from '../../features/cloud-foundry/cf.helpers';

@Directive({
  selector: '[cfUserPermission]'
})
export class CFPermissionDirective implements OnDestroy, OnInit {

  @Input()
  public cfUserPermission: CFUserPermissions;

  @Input()
  public cfUserPermissionEndpointGuid: string;

  @Input()
  private cfUserPermissionOrganizationGuid: string;

  @Input()
  private cfUserPermissionSpaceGuid: string;

  private canSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CFUserPermissionsService,
  ) { }

  public ngOnInit() {
    this.canSub = this.waitForEndpointPermissions(this.cfUserPermissionEndpointGuid).pipe(
      switchMap(() => this.currentUserPermissionsService.can(
        this.cfUserPermission,
        this.cfUserPermissionEndpointGuid,
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
    if (this.cfUserPermissionSpaceGuid && !this.cfUserPermissionOrganizationGuid) {
      return this.cfUserPermissionSpaceGuid;
    }
    return this.cfUserPermissionOrganizationGuid;
  }

  private getSpaceGuid() {
    if (this.cfUserPermissionOrganizationGuid) {
      return this.cfUserPermissionSpaceGuid;
    }
    return null;
  }


}
