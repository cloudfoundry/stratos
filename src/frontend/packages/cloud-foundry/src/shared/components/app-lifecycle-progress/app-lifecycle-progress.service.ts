import {
  Injectable,
  inject,
  effect,
  ElementRef,
  EnvironmentInjector,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AppApplicationActionsService } from '../../services/application-actions.service';
import { AppLifecycleProgressComponent } from './app-lifecycle-progress.component';

/**
 * AppLifecycleProgressService
 *
 * Owns the Angular CDK OverlayRef that mounts <app-lifecycle-progress>
 * when a lifecycle action is in flight. Two positioning modes:
 *
 *   Anchored — flexibleConnectedTo(actionBarElementRef), used while the
 *     user is on the app detail page and the action bar is visible.
 *
 *   Viewport-edge — globalPositionStrategy().right('1rem').top('4rem'),
 *     used when the user has navigated away from the detail page.
 *
 * Scope: MUST be component-scoped (not providedIn: 'root') because it
 * depends on AppApplicationActionsService, which itself is component-
 * scoped at ApplicationTabsBaseComponent (it injects ApplicationService,
 * whose CF_GUID / APP_GUID tokens only exist in that injector subtree).
 * Provide this service in the same providers array as AppApplicationActionsService.
 *
 * Effect & router subscription are set up in initialize() rather than at
 * construction time so the caller can control when the service activates.
 * Call initialize() from ApplicationTabsBaseComponent.ngOnInit().
 * Call destroy() from ApplicationTabsBaseComponent.ngOnDestroy().
 */
@Injectable()
export class AppLifecycleProgressService {
  private overlay = inject(Overlay);
  private router = inject(Router);
  private actions = inject(AppApplicationActionsService);
  private envInjector = inject(EnvironmentInjector);
  // Component-scoped Injector chain. Captured here (not at mount) so the
  // ComponentPortal sees the same providers AppApplicationActionsService
  // is registered under — without it the portal resolves through the CDK
  // overlay's environment injector and throws NG0201.
  private parentInjector = inject(Injector);

  private overlayRef: OverlayRef | null = null;
  private anchor: ElementRef | null = null;
  private routeSub: Subscription | null = null;
  private effectRef: ReturnType<typeof effect> | null = null;

  /**
   * Called by ApplicationTabsBaseComponent.ngOnInit() — activates the
   * mount/unmount effect and route-change reposition listener.
   */
  initialize(): void {
    // effect() requires an injection context; use runInInjectionContext
    // so we can call this from ngOnInit (outside constructor).
    this.effectRef = runInInjectionContext(this.envInjector, () =>
      effect(() => {
        // showProgress spans the full op + 10s linger window managed by
        // AppApplicationActionsService.runLifecycleAction. Mount/unmount
        // tracks that signal directly — no settle delay here.
        const show = this.actions.showProgress();
        if (show && !this.overlayRef) {
          this.mount();
        } else if (!show && this.overlayRef) {
          this.unmount();
        }
      })
    );

    this.routeSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => this.reposition());
  }

  /**
   * Called by ApplicationTabsBaseComponent.ngOnDestroy() — tears down
   * the effect, route subscription, and any open overlay.
   */
  destroy(): void {
    this.effectRef?.destroy();
    this.effectRef = null;
    this.routeSub?.unsubscribe();
    this.routeSub = null;
    this.unmount();
  }

  /**
   * Called by ApplicationActionBarComponent.ngOnInit() / ngOnDestroy()
   * to register or deregister the anchor element. When set and the user
   * is on the app detail route, the overlay positions relative to the
   * action bar. When null (action bar destroyed), falls back to
   * viewport-edge mode.
   */
  setAnchor(el: ElementRef | null): void {
    this.anchor = el;
    this.reposition();
  }

  private mount(): void {
    this.overlayRef = this.overlay.create({ hasBackdrop: false });
    const portal = new ComponentPortal(AppLifecycleProgressComponent, null, this.parentInjector);
    this.overlayRef.attach(portal);
    this.reposition();
  }

  private reposition(): void {
    if (!this.overlayRef) return;

    if (this.anchor && this.isOnAppDetailRoute()) {
      // Anchored mode: attach below the right edge of the action bar.
      const positionStrategy = this.overlay
        .position()
        .flexibleConnectedTo(this.anchor)
        .withPositions([{
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8,
        }]);
      this.overlayRef.updatePositionStrategy(positionStrategy);
    } else {
      // Viewport-edge mode: top-right corner, stays visible regardless
      // of which page the user has navigated to.
      const positionStrategy = this.overlay.position().global().right('1rem').top('4rem');
      this.overlayRef.updatePositionStrategy(positionStrategy);
    }
  }

  private isOnAppDetailRoute(): boolean {
    return /\/applications\/[^/]+\/[^/]+/.test(this.router.url);
  }

  private unmount(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
