import {
  AfterViewInit,
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
import { KubeConfigImportComponent } from './kube-config-import/kube-config-import.component';
import { KubeConfigSelectionComponent } from './kube-config-selection/kube-config-selection.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-config-registration',
  templateUrl: './kube-config-registration.component.html',

  standalone: true,
  imports: [
    CommonModule,
    SteppersComponent,
    StepComponent,
    KubeConfigSelectionComponent,
    KubeConfigImportComponent,
  ],
})
export class KubeConfigRegistrationComponent implements AfterViewInit, OnDestroy {
  // FWT-959 Part 2: SignalStepHandle wiring.
  //
  // Both child step components already own most of the state (selection's
  // valid$ + onEnter, import's onEnter + onNext + applyStarted/busy). The
  // parent assembles per-step handles that delegate into the children via
  // @ViewChild and bridges the children's RxJS surface into local signals
  // for the reactive bits the handles need.
  //
  // Cross-step data flow (selection → import) was previously plumbed via
  // the legacy `onNext` -> `onEnter(data)` data-return path. Signal-handle
  // `submit()` has no return-value channel, so the import handle's onEnter
  // pulls the cluster list straight from the selector's KubeConfigHelper.
  @ViewChild('selector', { static: false }) selector!: KubeConfigSelectionComponent;
  @ViewChild('importer', { static: false }) importer!: KubeConfigImportComponent;

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Cancel target shared between the stepper's cancel attr and the
  // submit() Router.navigate call so the two stay in sync.
  readonly cancelUrl = '/endpoints';

  private selectionValid = signal<boolean>(false);
  private importerBusy = signal<boolean>(false);
  private bridgeSubs: Subscription[] = [];

  selectionStepHandle: SignalStepHandle = {
    valid: this.selectionValid.asReadonly(),
    onEnter: () => this.selector?.onEnter(),
    // No submit — the step auto-advances (ignoreSuccess undefined). The
    // cluster list is consumed lazily by the review step's onEnter via
    // the shared KubeConfigHelper instance scoped to the selector.
  };

  reviewStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    canClose: computed(() => !this.importer?.applyStartedSignal()),
    disablePrevious: this.importerBusy.asReadonly(),
    destructiveStep: computed(() => !this.importer?.applyStartedSignal()),
    finishButtonText: computed(() =>
      this.importer?.applyStartedSignal() ? 'Close' : 'Import'
    ),
    onEnter: async () => {
      // Pull the freshly-selected clusters from the selector's helper and
      // hand them to the import step. Replaces the legacy `onNext` data
      // return path (selection.onNext returned `{ data: clusters }` and the
      // stepper passed that to import.onEnter via pOnEnter).
      const clusters = await firstValueFrom(this.selector.helper.clusters$.pipe(take(1)));
      this.importer.onEnter(clusters);
    },
    submit: async () => {
      // Two-click "Import then Close" semantic. The importer's existing
      // onNext encapsulates BOTH branches (start-import returns
      // ignoreSuccess, second-click returns redirect). We delegate to it
      // to preserve the side-effects (busy flag, processAction kickoff)
      // and translate its result into the signal-handle Promise contract.
      const result = await firstValueFrom(this.importer.onNext(0, null as any));
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
        return { ignoreSuccess: true };
      }
    },
  };

  ngAfterViewInit() {
    // Bridge child observables into local signals so the handles'
    // computed/readonly fields re-evaluate reactively. We use plain
    // RxJS subscriptions (vs `toSignal`) so the parent keeps explicit
    // teardown control across stepper re-entries and so we can call
    // markForCheck on this OnPush parent when child state flips.
    this.bridgeSubs.push(
      this.selector.valid$.subscribe(v => {
        this.selectionValid.set(!!v);
        this.cdr.markForCheck();
      }),
    );
    this.bridgeSubs.push(
      this.importer.busy$.subscribe(v => {
        this.importerBusy.set(!!v);
        this.cdr.markForCheck();
      }),
    );
  }

  ngOnDestroy() {
    this.bridgeSubs.forEach(s => s.unsubscribe());
  }
}
