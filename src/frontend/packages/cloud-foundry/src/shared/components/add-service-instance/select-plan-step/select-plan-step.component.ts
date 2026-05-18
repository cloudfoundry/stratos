import { AsyncPipe, CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnDestroy, ViewChild, ViewContainerRef, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomFormFieldComponent, MatLabelComponent } from '@stratosui/core';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest as observableCombineLatest, Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import {
  canShowServicePlanCosts,
  getPlanAccessibilityV3,
  getServicePlanName,
} from '../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { ServiceCatalogDataService, SignalSource } from '../../../../../../cloud-foundry/src/services/endpoint-data/service-catalog-data.service';
import { StServicePlan, StServicePlanVisibility } from '../../../../../../cloud-foundry/src/services/endpoint-data/stratos-types';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { FocusDirective } from '../../../../../../core/src/shared/components/focus.directive';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { StratosStatus } from '../../../../../../store/src/types/shared.types';
import { ServicePlanPriceComponent } from '../../service-plan-price/service-plan-price.component';
import { ServicePlanPublicComponent } from '../../service-plan-public/service-plan-public.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
import { NoServicePlansComponent } from '../no-service-plans/no-service-plans.component';

interface SelectPlanForm {
  servicePlans: FormControl<string>;
}

@Component({
  selector: 'app-select-plan-step',
  templateUrl: './select-plan-step.component.html',
  styleUrls: ['./select-plan-step.component.scss'],
  providers: [
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    AsyncPipe,
    FocusDirective,
    MetadataItemComponent,
    CardStatusComponent,
    ServicePlanPublicComponent,
    ServicePlanPriceComponent
]
})
export class SelectPlanStepComponent implements OnDestroy {
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
  // toObservable() must run inside an injection context — lift the
  // bridge to a class field so downstream pipes can subscribe later.
  private csiState$ = toObservable(this.csiState.state);

  selectedPlan$!: Observable<StServicePlan | undefined>;
  private selectedPlanAccessibilitySignal = signal<StratosStatus | null>(null);
  selectedPlanAccessibility = this.selectedPlanAccessibilitySignal.asReadonly();
  cSIHelperService!: CreateServiceInstanceHelper;
  @ViewChild('noplans', { read: ViewContainerRef, static: true })
  noPlansDiv!: ViewContainerRef;

  validate = signal<boolean>(false);
  subscription!: Subscription;
  stepperForm: FormGroup<SelectPlanForm>;
  servicePlans$: Observable<StServicePlan[]>;
  displayNames: { [guid: string]: string } = {};

  constructor() {
    this.stepperForm = new FormGroup<SelectPlanForm>({
      servicePlans: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
    });

    // Keep `validate` synced with the form's actual validity. The parent
    // wizard's selectPlanHandle.valid reads this signal; if we only
    // updated it inside the one-shot servicePlans$ subscription in
    // onEnter, manual plan picks after that point would never re-flip
    // validate to true and the Next button would stay disabled.
    this.stepperForm.statusChanges.subscribe(() => {
      this.validate.set(this.stepperForm.valid);
    });

    // Derive selectedPlanAccessibility from the active visibility fetch
    // + cached isPublic flag. When the form selection changes, the tap()
    // below swaps _planVisSource and _planIsPublic; this effect re-runs
    // once the new source's value lands.
    runInInjectionContext(this.injector, () => {
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
    });

    this.servicePlans$ = this.csiState$.pipe(
      filter(p => !!p.orgGuid && !!p.spaceGuid && !!p.serviceGuid),
      distinctUntilChanged((x, y) => {
        return (x.cfGuid === y.cfGuid && x.spaceGuid === y.spaceGuid && x.orgGuid === y.orgGuid && x.serviceGuid === y.serviceGuid);
      }),
      switchMap(state => {
        this.cSIHelperService = this.cSIHelperServiceFactory.create(state.cfGuid, state.serviceGuid);
        // Trigger the per-CNSI services-details fetch (idempotent).
        // Marketplace-mode init calls this elsewhere; bind-service mode
        // (Applications → Bind Service) skips that init path so the
        // helper had to drive the load itself or the plan dropdown
        // would stay empty with "no visible plans".
        void this.cSIHelperService.load();
        return this.cSIHelperService.servicePlans$;
      }),
      tap(o => {
        if (o.length === 0) {
          this.stepperForm.controls.servicePlans.disable();
          this.clearNoPlans();
          this.createNoPlansComponent();
          setTimeout(() => this.validate.set(false));
        }
        if (o.length > 0) {
          this.stepperForm.controls.servicePlans.enable();
          this.clearNoPlans();
        }
      }),
      map(plans => [...plans].sort((a, b) => this.getDisplayName(a).localeCompare(this.getDisplayName(b)))),
      publishReplay(1),
      refCount(),
    );

    this.selectedPlan$ = observableCombineLatest(
      this.stepperForm.statusChanges.pipe(startWith(true)),
      this.servicePlans$).pipe(
        filter(([, servicePlans]) => !!servicePlans && servicePlans.length > 0),
        map(([, servicePlans]) => {
          return servicePlans.find(s => s.guid === this.stepperForm.controls.servicePlans.value);
        }),
        filter(selectedServicePlan => !!selectedServicePlan),
        tap(selectedServicePlan => {
          this._planIsPublic.set(selectedServicePlan.visibilityType === 'public');
          this._planVisSource.set(
            this.serviceCatalog.planVisibility(selectedServicePlan.cnsiGuid, selectedServicePlan.guid),
          );
        })
      );

  }

  getDisplayName = (selectedPlan: StServicePlan) => {
    if (!this.displayNames[selectedPlan.guid]) {
      this.displayNames[selectedPlan.guid] = getServicePlanName(selectedPlan);
    }
    return this.displayNames[selectedPlan.guid];
  }

  onEnter = () => {
    this.subscription = this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      withLatestFrom(this.csiState$),
      tap(([servicePlans, createServiceInstanceState]) => {
        if (this.modeService.isEditServiceInstanceMode()) {
          this.stepperForm.controls.servicePlans.setValue(createServiceInstanceState.servicePlanGuid ?? '');
        } else {
          this.stepperForm.controls.servicePlans.setValue(servicePlans[0]?.guid ?? '');
        }
        this.stepperForm.updateValueAndValidity();
        this.validate.set(this.stepperForm.valid);
      }),
    ).subscribe();
  }

  onNext = (): Observable<StepOnNextResult> => {
    this.csiState.setServicePlan(this.stepperForm.controls.servicePlans.value);
    return this.selectedPlan$.pipe(
      map((selectedServicePlan: StServicePlan | undefined) => ({
        success: true,
        data: selectedServicePlan
      }))
    );
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.subscription);
  }


  canShowCosts(selectedPlan: StServicePlan): boolean {
    return canShowServicePlanCosts(selectedPlan);
  }

  private createNoPlansComponent() {
    return this.noPlansDiv.createComponent(NoServicePlansComponent);
  }
  private clearNoPlans() {
    return this.noPlansDiv.clear();
  }

}
