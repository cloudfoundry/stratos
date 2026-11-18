import { Directive, TemplateRef, ViewContainerRef, computed, effect, inject, input, untracked } from '@angular/core';

import { PermissionTypes } from '../core/permissions/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../core/permissions/current-user-permissions.service';

@Directive({
  selector: '[appUserPermission]',
  standalone: true
})
export class UserPermissionDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);

  // Accept null/undefined so `*appUserPermission="observable | async"` works —
  // async pipe emits null on first CD before the observable produces a value.
  public readonly appUserPermission = input<PermissionTypes[] | null>();

  public readonly appUserPermissionEndpointGuid = input<string>();

  // Built again only when the inputs change.
  private readonly checks = computed(() => {
    const permissions = this.appUserPermission();
    const endpointGuid = this.appUserPermissionEndpointGuid();
    return (permissions ?? []).map(permission => this.currentUserPermissionsService.can(permission, endpointGuid));
  });

  // Shown when any of the permissions passes.
  private readonly allowed = computed(() => this.checks().some(check => check()));

  constructor() {
    effect(() => {
      const allowed = this.allowed();
      untracked(() => {
        this.viewContainer.clear();
        if (allowed) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      });
    });
  }
}
