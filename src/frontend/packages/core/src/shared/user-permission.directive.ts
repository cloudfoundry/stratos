import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from '../../../store/src/app-state';
import { CurrentUserPermissions } from '../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/current-user-permissions.service';

@Directive({
  selector: '[appUserPermission]'
})
export class UserPermissionDirective implements OnDestroy, OnInit {

  @Input()
  public appUserPermission: CurrentUserPermissions;

  private canSub: Subscription;

  constructor(
    private store: Store<AppState>,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) { }

  public ngOnInit() {
    this.canSub = this.currentUserPermissionsService.can(this.appUserPermission).subscribe(
      can => {
        if (can) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
          this.viewContainer.clear();
        }
      }
    );
  }

  public ngOnDestroy() {
    if (this.canSub) {
      this.canSub.unsubscribe();
    }
  }
}
