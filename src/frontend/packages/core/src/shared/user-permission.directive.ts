import { Directive, OnChanges, OnDestroy, SimpleChanges, TemplateRef, ViewContainerRef, inject, input } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { PermissionTypes } from '../core/permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/permissions/current-user-permissions.service';

@Directive({
  selector: '[appUserPermission]',
  standalone: true
})
export class UserPermissionDirective implements OnChanges, OnDestroy {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);

  // Accept null/undefined so `*appUserPermission="observable | async"` works —
  // async pipe emits null on first CD before the observable produces a value.
  public readonly appUserPermission = input<PermissionTypes[] | null>();

  public readonly appUserPermissionEndpointGuid = input<string>();

  private canSub?: Subscription;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['appUserPermission'] || changes['appUserPermissionEndpointGuid']) {
      this.setupPermissionCheck();
    }
  }

  public ngOnDestroy() {
    this.canSub?.unsubscribe();
  }

  private setupPermissionCheck() {
    // Tear down the previous permission subscription and any rendered template
    // before evaluating the new input. Without this, a cold template fragment
    // lingers when the input transitions from a valid array back to null.
    this.canSub?.unsubscribe();
    this.canSub = undefined;
    this.viewContainer.clear();

    const appUserPermission = this.appUserPermission();
    if (!appUserPermission || appUserPermission.length === 0) {
      return;
    }

    const checks: Observable<boolean>[] = appUserPermission.map(
      (permission: PermissionTypes) =>
        this.currentUserPermissionsService.can(permission, this.appUserPermissionEndpointGuid())
    );

    this.canSub = combineLatest(checks).pipe(
      map((results: boolean[]) => results.some(Boolean))
    ).subscribe(can => {
      this.viewContainer.clear();
      if (can) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
