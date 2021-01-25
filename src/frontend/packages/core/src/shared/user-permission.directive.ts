import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { PermissionTypes } from '../core/permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/permissions/current-user-permissions.service';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {
  @Input()
  public appUserPermission: PermissionTypes[];

  @Input()
  public appUserPermissionEndpointGuid: string;

  private canSub: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

  public ngOnInit() {
    // execute a permission check for every give permissiontype
    let $permissionChecks: Observable<boolean>[];
    $permissionChecks = this.appUserPermission.map((permission: PermissionTypes) => {
      return this.currentUserPermissionsService.can(permission,this.appUserPermissionEndpointGuid)
    });

    // permit user if one check results true
    this.canSub = combineLatest($permissionChecks).pipe(
      map((arr: boolean[])=>{
        for(const result of arr){
          if(result){
            return result;
          }
        }
        return false;
      })
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
