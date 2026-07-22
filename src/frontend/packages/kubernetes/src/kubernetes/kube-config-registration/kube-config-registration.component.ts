import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import {
  SignalStepHandle,
  StepComponent,
  SteppersComponent,
} from '@stratosui/core';
import { KubeConfigHelper } from './kube-config.helper';
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-config-registration',
  templateUrl: './kube-config-registration.component.html',
  // KubeConfigHelper is provided here (not on the selection component) so
  // the parsed cluster list survives step transitions: the stepper
  // instantiates/destroys step content lazily, and the review step's
  // onEnter needs the clusters the (by then destroyed) selection step
  // produced. The selection step and its table sub-components inject the
  // same instance from this scope.
  providers: [KubeConfigHelper],
  standalone: true,
  imports: [
    CommonModule,
    SteppersComponent,
    StepComponent,
    KubeConfigSelectionComponent,
    KubeConfigImportComponent,
  ],
})
export class KubeConfigRegistrationComponent implements OnDestroy {
  // FWT-959 Part 2: SignalStepHandle wiring.
  //
  // Both child step components already own most of the state (selection's
  // valid$ + onEnter, import's onEnter + onNext + applyStarted/busy). The
  // parent assembles per-step handles that delegate into the children via
  // @ViewChild and bridges the children's RxJS surface into local signals
  // for the reactive bits the handles need. Step children are instantiated
  // lazily on activation, so the bridges are wired in ViewChild *setters*
  // (an ngAfterViewInit pass would only ever see the first step's child).
  private helper = inject(KubeConfigHelper);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Cancel target shared between the stepper's cancel attr and the
  // submit() Router.navigate call so the two stay in sync.
  readonly cancelUrl = '/endpoints';

  private selectionValid = signal<boolean>(false);
  private importerBusy = signal<boolean>(false);
  // Parent-owned mirror of the importer's applyStarted state. The importer
  // is destroyed whenever it is not the active step, so handle computeds
  // (and the selection step's [applyStarted] input) read this signal
  // instead of reaching into the child: a computed whose first evaluation
  // dereferences an undefined ViewChild captures zero signal dependencies
  // and never re-evaluates. Lifecycle matches the importer's own flag:
  // reset on review-step entry, set on the first Import click.
  readonly applyStarted = signal<boolean>(false);

  private _selector?: KubeConfigSelectionComponent;
  private _importer?: KubeConfigImportComponent;
  private selectorSub?: Subscription;
  private importerSub?: Subscription;

  @ViewChild('selector', { static: false })
  set selectorRef(v: KubeConfigSelectionComponent | undefined) {
    this._selector = v;
    this.selectorSub?.unsubscribe();
    this.selectorSub = undefined;
    if (v) {
      this.selectorSub = v.valid$.subscribe(valid => {
        this.selectionValid.set(!!valid);
        this.cdr.markForCheck();
      });
    }
  }

  @ViewChild('importer', { static: false })
  set importerRef(v: KubeConfigImportComponent | undefined) {
    this._importer = v;
    this.importerSub?.unsubscribe();
    this.importerSub = undefined;
    if (v) {
      this.importerSub = v.busy$.subscribe(b => {
        this.importerBusy.set(!!b);
        this.cdr.markForCheck();
      });
    }
  }

  selectionStepHandle: SignalStepHandle = {
    valid: this.selectionValid.asReadonly(),
    onEnter: () => this._selector?.onEnter(),
    // No submit — the step auto-advances. The cluster list is consumed by
    // the review step's onEnter via the shared KubeConfigHelper instance.
  };

  reviewStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    canClose: computed(() => !this.applyStarted()),
    disablePrevious: this.importerBusy.asReadonly(),
    destructiveStep: computed(() => !this.applyStarted()),
    finishButtonText: computed(() =>
      this.applyStarted() ? 'Close' : 'Import'
    ),
    onEnter: async () => {
      // Hand the freshly-selected clusters to the import step. Replaces
      // the legacy `onNext` data return path (selection.onNext returned
      // `{ data: clusters }` and the stepper passed that to import.onEnter
      // via pOnEnter). The importer resets its applyStarted flag in
      // onEnter — mirror that here.
      this.applyStarted.set(false);
      const clusters = await firstValueFrom(this.helper.clusters$.pipe(take(1)));
      this._importer?.onEnter(clusters);
    },
    submit: async () => {
      // Two-click "Import then Close" semantic. The importer's existing
      // onNext encapsulates BOTH branches (start-import returns
      // ignoreSuccess, second-click returns redirect). We delegate to it
      // to preserve the side-effects (busy flag, processAction kickoff)
      // and translate its result into the signal-handle Promise contract.
      const result = await firstValueFrom(this._importer!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to import kube config');
      }
      if (result.redirect) {
        // Legacy `redirect: true` (no payload) meant "navigate to the
        // stepper's cancel URL". cancelUrl is the single source of truth
        // shared with the <app-steppers [cancel]> binding.
        await this.router.navigateByUrl(this.cancelUrl);
        return;
      }
      if (result.ignoreSuccess) {
        this.applyStarted.set(true);
        return { ignoreSuccess: true };
      }
    },
  };

  ngOnDestroy() {
    this.selectorSub?.unsubscribe();
    this.importerSub?.unsubscribe();
  }
}
