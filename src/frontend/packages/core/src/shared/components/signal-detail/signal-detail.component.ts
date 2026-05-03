import { ChangeDetectionStrategy, Component, Input, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TailwindSnackBarService } from '../../services/tailwind-snackbar.service';

// Mirrors SignalListHeaderAction shape (see signal-list.component.ts) so that
// page-level actions (Edit, Delete, custom verbs) compose identically across
// list and detail surfaces. Kept as a separate type so the two component
// trees can evolve independently if the patterns diverge.
export interface SignalDetailHeaderAction {
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: Signal<boolean>;
  readonly visible?: Signal<boolean>;
  readonly primary?: boolean;
  readonly tooltip?: string;
  readonly invoke: () => void | Promise<void>;
}

export interface SignalDetailBreadcrumb {
  readonly label: string;
  readonly link?: readonly (string | number)[];
}

export type SignalDetailStatusColor = 'success' | 'warning' | 'danger' | 'neutral';

export interface SignalDetailStatus {
  readonly label: string;
  readonly color?: SignalDetailStatusColor;
}

export interface SignalDetailTab {
  readonly label: string;
  readonly icon?: string;
  // Router-link target. Use a relative array (e.g. ['summary']) so the tab
  // nav resolves against the host component's ActivatedRoute and supports
  // deep-linking (per design-doc Q3 — keep router children, not flat URLs).
  readonly link: readonly (string | number)[];
  // Optional visibility predicate. When the signal returns true the tab is
  // hidden; admin-only or feature-gated tabs flip this without route guards.
  readonly hidden?: Signal<boolean>;
}

export interface SignalDetailConfig {
  // Breadcrumbs render left of the header-actions, separated by chevrons.
  // Reactive so the trail can change as the focused entity loads (e.g.
  // "Cloud Foundry > Org > Space > <instance-name>" once the instance
  // resolves from a `byGuid` lookup).
  readonly breadcrumbs?: Signal<readonly SignalDetailBreadcrumb[]>;
  // Status pill rendered next to the breadcrumbs. Reactive so the pill
  // updates when the entity's last operation finishes (e.g. async-job
  // succeeded/failed).
  readonly status?: Signal<SignalDetailStatus | undefined>;
  // Header actions rendered on the right side of the toolbar. Same shape
  // as SignalListConfig.headerActions — see invokeHeaderAction below for
  // error-handling contract.
  readonly headerActions?: readonly SignalDetailHeaderAction[];
  // Tab nav entries. When undefined / empty the tab nav row is skipped
  // (single-page detail). When provided the consumer is expected to mount
  // a <router-outlet> in the ng-content body — the framework doesn't
  // assume that for them, since some detail pages render raw content.
  readonly tabs?: Signal<readonly SignalDetailTab[]>;
  // Page-level loading + error state. When loading is truthy the body slot
  // is replaced with a spinner. When error is non-null the body is replaced
  // with an error banner. (Per-tab loading/error is the tab component's job.)
  readonly loading?: Signal<boolean>;
  readonly error?: Signal<unknown | null>;
}

@Component({
  selector: 'app-signal-detail',
  templateUrl: './signal-detail.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' }
})
export class SignalDetailComponent {
  @Input({ required: true }) config!: SignalDetailConfig;

  private snackBar = inject(TailwindSnackBarService);

  // Breadcrumbs / status / tabs accessors --------------------------------
  // These thin wrappers let the template reach into possibly-undefined
  // signals without sprinkling optional-chains through the markup.

  breadcrumbs(): readonly SignalDetailBreadcrumb[] {
    return this.config.breadcrumbs?.() ?? [];
  }

  status(): SignalDetailStatus | undefined {
    return this.config.status?.();
  }

  // Header actions ------------------------------------------------------

  visibleHeaderActions(): readonly SignalDetailHeaderAction[] {
    const all = this.config.headerActions;
    if (!all || all.length === 0) return [];
    return all.filter(a => (a.visible ? a.visible() : true));
  }

  isHeaderActionDisabled(act: SignalDetailHeaderAction): boolean {
    return act.disabled ? act.disabled() : false;
  }

  // Same error-handling contract as SignalListComponent.invokeHeaderAction:
  // short-circuit when disabled, fire-and-forget the invoke, surface async
  // errors via TailwindSnackBarService so the caller doesn't need its own
  // try/catch around every action.
  invokeHeaderAction(act: SignalDetailHeaderAction, ev: Event): void {
    ev.stopPropagation();
    if (this.isHeaderActionDisabled(act)) return;
    try {
      const result = act.invoke();
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          this.snackBar.open(`${act.label} failed: ${msg}`, 'Dismiss');
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.snackBar.open(`${act.label} failed: ${msg}`, 'Dismiss');
    }
  }

  // Tailwind classes for a header-action button. Matches SignalListComponent
  // styling so list and detail toolbars look identical when shown together.
  headerActionClasses(act: SignalDetailHeaderAction): string {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    if (act.primary) {
      return `${base} bg-accent border-accent text-white hover:bg-accent/90`;
    }
    return `${base} bg-content-bg border-content-border text-content-text hover:bg-gray-100 dark:hover:bg-gray-700`;
  }

  // Tabs ---------------------------------------------------------------

  visibleTabs(): readonly SignalDetailTab[] {
    const all = this.config.tabs?.() ?? [];
    return all.filter(t => (t.hidden ? !t.hidden() : true));
  }

  trackTab(_index: number, tab: SignalDetailTab): string {
    return tab.link.join('/');
  }

  // Status pill --------------------------------------------------------

  statusPillClasses(color: SignalDetailStatusColor | undefined): string {
    const base = 'px-2 py-0.5 text-xs rounded-full font-medium';
    switch (color) {
      case 'success': return `${base} bg-success-shade-100 text-success-shade-800 dark:bg-success-shade-900/30 dark:text-success-shade-200`;
      case 'warning': return `${base} bg-warning-shade-100 text-warning-shade-800 dark:bg-warning-shade-900/30 dark:text-warning-shade-200`;
      case 'danger':  return `${base} bg-danger-shade-100 text-danger-shade-800 dark:bg-danger-shade-900/30 dark:text-danger-shade-200`;
      default:        return `${base} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  }

  // Loading / error ----------------------------------------------------

  isLoading(): boolean {
    return !!this.config.loading?.();
  }

  errorMessage(): string {
    const err = this.config.error?.();
    if (err == null) return '';
    return err instanceof Error ? err.message : String(err);
  }

  hasError(): boolean {
    return this.config.error?.() != null;
  }

  // Toolbar visibility ------------------------------------------------
  // Skip the entire toolbar row when nothing would render in it (no
  // breadcrumbs, no status, no actions). Avoids an empty bordered strip
  // for detail pages that only need tabs + body.

  showToolbar(): boolean {
    return (
      this.breadcrumbs().length > 0 ||
      !!this.status() ||
      this.visibleHeaderActions().length > 0
    );
  }
}
