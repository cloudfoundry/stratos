import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, Signal, computed, inject, input, linkedSignal, runInInjectionContext, signal, untracked, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { StratosTabMetadata } from '../../../core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { IBreadcrumb } from '../../../shared/components/breadcrumbs/breadcrumbs.types';
import { TabNavService } from '../../../tab-nav.service';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';



export interface IPageSideNavTab extends StratosTabMetadata {
  // The tab's gate: shown only while it reads false (null = not known yet).
  // When present, the extension metadata's hidden() is not used.
  isHidden?: Signal<boolean | null>;
}

const SHOWN = signal(false).asReadonly();

@Component({
  selector: 'app-page-side-nav',
  templateUrl: './page-side-nav.component.html',
  styleUrls: ['./page-side-nav.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'close()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class PageSideNavComponent {
  tabNavService = inject(TabNavService);
  private activatedRoute = inject(ActivatedRoute);
  private cups = inject(CurrentUserPermissionsService);
  private http = inject(HttpClient);
  private dashboardSignals = inject(DashboardSignalService);
  private injector = inject(Injector);


  readonly tabs = input<IPageSideNavTab[] | null>();

  // The tabs as rendered, each with its gate. A new list of the same
  // length keeps the tabs already shown, so their gates are not asked again.
  readonly shownTabs = linkedSignal<IPageSideNavTab[] | null | undefined, IPageSideNavTab[]>({
    source: this.tabs,
    computation: (tabs, previous) => {
      const shown = previous?.value ?? [];
      if (!tabs) {
        return [];
      }
      if (tabs.length === shown.length) {
        return shown;
      }
      // A tab's hidden() is extension code returning a stream; run it outside
      // the reactive context so it can neither add dependencies nor fail on a
      // signal write, and read it as a signal. It runs in this view's
      // injection context, so it may inject() (for example to watch a
      // permission signal).
      return untracked(() => tabs.map(tab => ({
        ...tab,
        isHidden: tab.isHidden ?? (tab.hidden
          ? toSignal(
            runInInjectionContext(this.injector, () => tab.hidden!(this.activatedRoute, this.cups, this.http)),
            { initialValue: null, injector: this.injector })
          : SHOWN),
      })));
    },
  });

  // Bound from async-piped streams that may emit null/undefined before the
  // header resolves; interpolation renders those as an empty string.
  public readonly header = input<string | null>();
  public readonly activeTab = computed(() => this.tabNavService.currentTabHeader()?.label ?? null);
  public breadcrumbs$!: Observable<IBreadcrumb[]>;
  public isMobile$: Observable<boolean>;
  // The compact dropdown, opened by its button as well as by hover.
  public readonly open = signal(false);
  private readonly compactToggle = viewChild.required<ElementRef<HTMLButtonElement>>('compactToggle');
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  close() {
    if (this.open()) {
      this.open.set(false);
      this.compactToggle().nativeElement.focus();
    }
  }

  // Focus leaving the nav closes the list, which would cover the page.
  onFocusOut(e: FocusEvent) {
    if (!this.el.nativeElement.contains(e.relatedTarget as Node | null)) {
      this.open.set(false);
    }
  }

  constructor() {
    this.isMobile$ = toObservable(this.dashboardSignals.isMobile);
  }

}
