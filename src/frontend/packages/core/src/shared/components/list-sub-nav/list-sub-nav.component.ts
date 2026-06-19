import { ChangeDetectionStrategy, Component, Input, Signal, computed, signal } from '@angular/core';

/**
 * Primary "create new <thing>" action for a list page. Rendered as a single
 * button on the right of the L5 sub-nav row, blue background with icon +
 * label. The whole button is the click target.
 *
 * `visible` is optional; when omitted the button shows. When provided as a
 * Signal<boolean>, the button hides while the signal returns false (typical
 * use: gate by user permission).
 */
export interface ListSubNavAddAction {
  readonly label: string;
  readonly icon?: string;
  readonly invoke: () => void;
  readonly visible?: Signal<boolean>;
  readonly disabled?: Signal<boolean>;
}

/**
 * Selection-aware action button for the L5 sub-nav row.
 *
 * Typically used for bulk operations that act on the current selection
 * (e.g. "Remove", "Assign Role"). Buttons appear to the right of the
 * selection indicator and to the left of the primary `addAction` button.
 *
 * Fields:
 * - `label`         — button text (also used as title fallback).
 * - `icon`          — optional material-icons glyph rendered before label.
 * - `invoke`        — called on click (only when not disabled).
 * - `disabled`      — optional signal; button is disabled while true.
 * - `visible`       — optional signal; button is hidden while false.
 * - `variant`       — visual style: 'primary' | 'destructive' | 'default'.
 * - `tooltip`       — title shown on hover (when enabled).
 * - `disabledReason`— title shown on hover when button is disabled
 *                     (overrides tooltip while disabled).
 * - `dataTest`      — data-test attribute value; defaults to
 *                     `list-sub-nav-action-<label>`.
 */
export interface ListSubNavAction {
  readonly label: string;
  readonly icon?: string;
  readonly invoke: () => void;
  readonly disabled?: Signal<boolean>;
  readonly visible?: Signal<boolean>;
  readonly variant?: 'primary' | 'destructive' | 'default';
  readonly tooltip?: string;
  readonly disabledReason?: string;
  readonly dataTest?: string;
}

/** Base Tailwind classes shared by all action variant buttons. */
const ACTION_BASE =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-sm ' +
  'transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

/** Variant-specific Tailwind additions. */
const VARIANT_CLASSES: Record<NonNullable<ListSubNavAction['variant']>, string> = {
  primary:     'bg-primary text-white hover:bg-primary/90',
  destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  default:     'border border-content-border bg-content-bg text-content-text hover:bg-gray-100 dark:hover:bg-gray-700',
};

/**
 * AppListSubNavComponent — the L5 row that sits above every list in the app.
 *
 * Renders a horizontal strip:
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │ Total <Thing>: <N>   [N selected · Clear] [actions…] [+ Add <Thing>] │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * - **Left:** `Total <Thing>: <N>` — colon form, plural always (handles
 *   0/1/N uniformly).
 * - **Right (in order):** selection indicator + Clear, action buttons,
 *   primary add button. Blue background, `+` icon and label,
 *   the whole button clickable.
 *
 * Always rendered on list pages, even when there's no add affordance —
 * keeps the count in a predictable location. When `addAction` is omitted
 * the row degrades to count-only on the left.
 *
 * Lives outside both `<app-signal-list>` and `<app-list>` so the same
 * pattern works for signal-native and legacy lists alike. See
 * 2026-05-07-list-sub-nav-pattern.md (KS plan) for design rationale.
 */
@Component({
  selector: 'app-list-sub-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-test="list-sub-nav"
         [class]="rowClasses">
      <div class="text-base font-semibold text-content-text whitespace-nowrap" data-test="list-sub-nav-title">
        {{ title }}: <span class="text-content-muted font-medium">{{ count() }}</span>
      </div>
      @if (isAdding && isAdding()) {
        <!-- Inline add-form slot. When the consumer flips its isAdding signal
             true, the right side of the row swaps the add button for the
             projected form. Used by Variables (Name/Value inputs + save/
             cancel) and any future page that wants the add form inline
             rather than below the list. -->
        <div data-test="list-sub-nav-form" class="flex items-center gap-2 flex-1 justify-end">
          <ng-content select="[subNavForm]"></ng-content>
        </div>
      } @else {
        <div class="flex items-center gap-2">
          <!-- Selection indicator + Clear -->
          @if (showSelected()) {
            <span data-test="list-sub-nav-selected"
                  class="flex items-center gap-1.5 text-sm text-content-muted">
              {{ selectedCount!() }} selected
              @if (onClearSelection) {
                <button
                  type="button"
                  data-test="list-sub-nav-clear"
                  (click)="onClearSelection()"
                  class="text-primary hover:underline font-medium">
                  Clear
                </button>
              }
            </span>
          }

          <!-- Contextual action buttons -->
          @for (action of actions; track action.label) {
            @if (isActionVisible(action)) {
              <button
                type="button"
                [disabled]="isActionDisabled(action)"
                (click)="action.invoke()"
                [attr.data-test]="action.dataTest ?? ('list-sub-nav-action-' + action.label)"
                [title]="actionTitle(action)"
                [class]="actionClasses(action)">
                @if (action.icon) {
                  <span class="material-icons text-base leading-5">{{ action.icon }}</span>
                }
                <span>{{ action.label }}</span>
              </button>
            }
          }

          <!-- Primary add button -->
          @if (addAction && isAddVisible()) {
            <button
              data-test="list-sub-nav-add"
              type="button"
              [disabled]="isAddDisabled()"
              (click)="addAction.invoke()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-sm
                     bg-primary text-white hover:bg-primary/90 transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed">
              <span class="material-icons text-base leading-5">{{ addAction.icon ?? 'add' }}</span>
              <span>{{ addAction.label }}</span>
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class ListSubNavComponent {
  /** Left-side label, e.g. "Total Routes". Plural always — colon and count
   *  are appended by the template. */
  @Input({ required: true }) title!: string;

  /** Reactive count source. For signal-list pages this is typically
   *  `config.totalFilteredResults`. Legacy callers can wrap an Observable
   *  with `toSignal()`. */
  @Input({ required: true }) count!: Signal<number>;

  /** Optional primary action. Omit for read-only lists. */
  @Input() addAction?: ListSubNavAddAction;

  /** When set and emits true, swaps the right-side add button for a
   *  projected `[subNavForm]` slot — lets pages with an inline add form
   *  (Variables) host it on the same row as the title rather than as a
   *  separate row. */
  @Input() isAdding?: Signal<boolean>;

  /** Optional list of contextual action buttons (e.g. bulk-operation
   *  buttons) rendered between the selection indicator and the add button.
   *  Buttons whose `visible` signal returns false are omitted from the DOM. */
  @Input() actions?: readonly ListSubNavAction[];

  /** When provided, shows "N selected" text on the right side while the
   *  signal returns a value greater than zero. */
  @Input() selectedCount?: Signal<number>;

  /** When provided alongside `selectedCount`, a "Clear" link is rendered
   *  that calls this function when clicked. */
  @Input() onClearSelection?: () => void;

  protected readonly isAddVisible = computed(() => {
    const v = this.addAction?.visible;
    return v ? v() : true;
  });

  /** Row classes. When the consumer wires `isAdding` (i.e., plans to host
   *  an inline form), reserve enough height to accommodate the form so
   *  the row doesn't shift between closed and open states. Pages without
   *  an inline form keep the natural compact button-row height. */
  protected get rowClasses(): string {
    const base = 'flex items-center justify-between gap-3 px-6 py-3 bg-content-bg border-b border-content-border';
    return this.isAdding ? `${base} min-h-[4.25rem]` : base;
  }

  protected readonly isAddDisabled = computed(() => {
    const d = this.addAction?.disabled;
    return d ? d() : false;
  });

  protected isActionDisabled(a: ListSubNavAction): boolean {
    return a.disabled ? a.disabled() : false;
  }

  protected isActionVisible(a: ListSubNavAction): boolean {
    return a.visible ? a.visible() : true;
  }

  protected actionTitle(a: ListSubNavAction): string {
    return this.isActionDisabled(a)
      ? (a.disabledReason ?? a.tooltip ?? a.label)
      : (a.tooltip ?? a.label);
  }

  protected actionClasses(a: ListSubNavAction): string {
    const variant = a.variant ?? 'default';
    return `${ACTION_BASE} ${VARIANT_CLASSES[variant]}`;
  }

  protected showSelected(): boolean {
    return !!this.selectedCount && this.selectedCount() > 0;
  }

  /** Constant count signal helper — useful for test stubs and pages that
   *  haven't yet wired a reactive source. Returns a Signal<number> that
   *  always emits the given value. */
  static constantCount(n: number): Signal<number> {
    return signal(n).asReadonly();
  }
}
