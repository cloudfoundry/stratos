import { CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EffectRef, Injector, Signal, ViewContainerRef, afterRenderEffect, computed, effect, inject, linkedSignal, signal, untracked, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomFormFieldComponent } from '@stratosui/core';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { naturalCompare } from '@stratosui/core';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  canShowServicePlanCosts,
  getPlanAccessibilityV3,
  getServicePlanName,
} from '../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { ServiceCatalogDataService, SignalSource } from '../../../../../../cloud-foundry/src/services/endpoint-data/service-catalog-data.service';
import { StServicePlan, StServicePlanVisibility } from '../../../../../../cloud-foundry/src/services/endpoint-data/stratos-types';
import { CardWrapperComponent } from '../../../../../../core/src/shared/components/cards/card/card.component';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { StratosStatus } from '../../../../../../store/src/types/shared.types';
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiState, CsiStateService } from '../csi-state.service';
import { NoServicePlansComponent } from '../no-service-plans/no-service-plans.component';

interface SelectPlanForm {
  servicePlans: FormControl<string>;
}

@Component({
  selector: 'app-select-plan-step',
  templateUrl: './select-plan-step.component.html',
  host: { class: 'flex-1' },
  providers: [
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    FocusDirective,
    MetadataItemComponent,
    CardWrapperComponent,
    CardStatusComponent,
    ServicePlanPublicComponent,
    ServicePlanPriceComponent
]
})
export class SelectPlanStepComponent {
  private cSIHelperServiceFactory = inject(CreateServiceInstanceHelperServiceFactory);
  private modeService = inject(CsiModeService);
  private serviceCatalog = inject(ServiceCatalogDataService);
  private csiState = inject(CsiStateService);
  private injector = inject(Injector);
  // The currently-selected plan's visibility fetch. Swapped each time
  // the form's plan selection changes; the constructor effect derives
  // selectedPlanAccessibility from this + the cached isPublic flag.
  private _planVisSource = signal<SignalSource<StServicePlanVisibility | null> | null>(null);
  private _planIsPublic = signal<boolean>(false);
  private selectedPlanAccessibilitySignal = signal<StratosStatus | null>(null);
  selectedPlanAccessibility = this.selectedPlanAccessibilitySignal.asReadonly();
  readonly noPlansDiv = viewChild.required('noplans', { read: ViewContainerRef });

  validate = signal<boolean>(false);
  stepperForm: FormGroup<SelectPlanForm>;
  displayNames: { [guid: string]: string } = {};

  // The service the plans belong to. Stays on the last complete pick while
  // the state is incomplete, and is the same object while the pick is
  // unchanged.
  private readonly planTarget = linkedSignal<CsiState, { cfGuid: string; serviceGuid: string } | undefined>({
    source: this.csiState.state,
    computation: (state, previous) => {
      if (!state.orgGuid || !state.spaceGuid || !state.serviceGuid) {
        return previous?.value;
      }
      const target = { cfGuid: state.cfGuid!, serviceGuid: state.serviceGuid };
      const last = previous?.value;
      return last && last.cfGuid === target.cfGuid && last.serviceGuid === target.serviceGuid ? last : target;
    },
  });
  // strict: cfGuid is set alongside org/space before a service is
  // pickable; create() itself throws if it is ever falsy.
  private readonly helper = computed(() => {
    const target = this.planTarget();
    // Building the helper acquires the endpoint's data, which writes signals
    return target ? untracked(() => this.cSIHelperServiceFactory.create(target.cfGuid, target.serviceGuid)) : undefined;
  });
  // The plans of the picked service, in display order; undefined until a
  // service is picked.
  readonly servicePlans = computed(() => {
    const plans = this.helper()?.servicePlans();
    return plans && [...plans].sort((a, b) => naturalCompare(this.getDisplayName(a), this.getDisplayName(b)));
  });
  private readonly planGuid: Signal<string>;
  readonly selectedPlan = computed(() => this.servicePlans()?.find(s => s.guid === this.planGuid()));
  private seedPlan?: EffectRef;

  constructor() {
    this.stepperForm = new FormGroup<SelectPlanForm>({
      servicePlans: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
    });
    const planControl = this.stepperForm.controls.servicePlans;
    this.planGuid = toSignal(planControl.valueChanges, { initialValue: planControl.value });

    // Keep `validate` synced with the form's actual validity. The parent
    // wizard's selectPlanHandle.valid reads this signal; if we only
    // updated it when the plans arrive, manual plan picks after that point
    // would never re-flip validate to true and the Next button would stay
    // disabled.
    this.stepperForm.statusChanges.subscribe(() => {
      this.validate.set(this.stepperForm.valid);
    });

    // Derive selectedPlanAccessibility from the active visibility fetch
    // + cached isPublic flag. When the selected plan changes, the effect
    // below swaps _planVisSource and _planIsPublic; this effect re-runs
    // once the new source's value lands.
    effect(() => {
      const src = this._planVisSource();
      if (!src) {
        this.selectedPlanAccessibilitySignal.set(null);
        return;
      }
      if (src.isLoading()) return;
      this.selectedPlanAccessibilitySignal.set(
        getPlanAccessibilityV3(this._planIsPublic(), src.value()),
      );
    });

    // Trigger the per-CNSI services-details fetch (idempotent).
    // Marketplace-mode init calls this elsewhere; bind-service mode
    // (Applications → Bind Service) skips that init path so the
    // helper had to drive the load itself or the plan dropdown
    // would stay empty with "no visible plans".
    effect(() => {
      const helper = this.helper();
      if (helper) {
        untracked(() => void helper.load());
      }
    });

    afterRenderEffect(() => {
      const plans = this.servicePlans();
      if (!plans) {
        return;
      }
      untracked(() => {
        if (plans.length === 0) {
          this.stepperForm.controls.servicePlans.disable();
          this.clearNoPlans();
          this.createNoPlansComponent();
          setTimeout(() => this.validate.set(false));
        } else {
          this.stepperForm.controls.servicePlans.enable();
          this.clearNoPlans();
        }
      });
    });

    effect(() => {
      const selectedPlan = this.selectedPlan();
      if (!selectedPlan) {
        return;
      }
      untracked(() => {
        this._planIsPublic.set(selectedPlan.visibilityType === 'public');
        this._planVisSource.set(
          this.serviceCatalog.planVisibility(selectedPlan.cnsiGuid, selectedPlan.guid),
        );
      });
    });
  }

  getDisplayName = (selectedPlan: StServicePlan) => {
    if (!this.displayNames[selectedPlan.guid]) {
      this.displayNames[selectedPlan.guid] = getServicePlanName(selectedPlan);
    }
    return this.displayNames[selectedPlan.guid];
  }

  onEnter = () => {
    // Each entry replaces the last one's pick, or both keep re-picking
    // the plan
    this.seedPlan?.destroy();
    this.seedPlan = effect(() => {
      const servicePlans = this.servicePlans();
      if (!servicePlans?.length) {
        return;
      }
      untracked(() => {
        const preselect = this.csiState.state().servicePlanGuid;
        if (this.modeService.isEditServiceInstanceMode()) {
          this.stepperForm.controls.servicePlans.setValue(preselect ?? '');
        } else if (preselect && servicePlans.some(p => p.guid === preselect)) {
          // Marketplace mode landed with a plan preselected via the
          // SERVICE_PLAN_URL_PARAM query param (per-row Create Instance
          // from the Plans tab). Honor it; user can still pick a different
          // plan before continuing.
          this.stepperForm.controls.servicePlans.setValue(preselect);
        } else {
          this.stepperForm.controls.servicePlans.setValue(servicePlans[0]?.guid ?? '');
        }
        this.stepperForm.updateValueAndValidity();
        this.validate.set(this.stepperForm.valid);
      });
    }, { injector: this.injector });
  }

  async onNext(): Promise<StepOnNextResult> {
    this.csiState.setServicePlan(this.stepperForm.controls.servicePlans.value);
    return { success: true, data: this.selectedPlan() };
  }

  canShowCosts(selectedPlan: StServicePlan): boolean {
    return canShowServicePlanCosts(selectedPlan);
  }

  private createNoPlansComponent() {
    return this.noPlansDiv().createComponent(NoServicePlansComponent);
  }
  private clearNoPlans() {
    return this.noPlansDiv().clear();
  }

}
