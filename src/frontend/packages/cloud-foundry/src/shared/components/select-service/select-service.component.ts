import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { of as observableOf } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, StepOnNextResult, naturalCompare } from '@stratosui/core';
import { ServicesWallService } from '../../../features/services/services/services-wall.service';
import { StServiceOffering } from '../../../services/endpoint-data/stratos-types';
import { CfServiceCardComponent } from '../cards/cf-service-card/cf-service-card.component';
import { CsiGuidsService } from '../add-service-instance/csi-guids.service';
import { CsiStateService } from '../add-service-instance/csi-state.service';

/**
 * Typed form interface for service selection
 */
interface SelectServiceForm {
  service: FormControl<string>;
}


@Component({
  selector: 'app-select-service',
  templateUrl: './select-service.component.html',
  host: { class: 'app-host-flex-1' },
  providers: [
    ServicesWallService
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CfServiceCardComponent
  ]
})
export class SelectServiceComponent implements AfterContentInit {
  private csiGuidService = inject(CsiGuidsService);
  private csiState = inject(CsiStateService);
  private servicesWallService = inject(ServicesWallService);

  // The active offerings fetch — a fresh SignalSource per (cfGuid,
  // spaceGuid) pair. Set in the csiState effect below.
  private offeringsSource = signal<ReturnType<ServicesWallService['getServicesInSpaceSource']> | null>(null);

  // Sorted by displayName/name. cf-service-card consumes StServiceOffering
  // directly now — no V2-envelope adapter step.
  readonly services: Signal<StServiceOffering[]> = computed(() => {
    const source = this.offeringsSource();
    if (!source) return [];
    const offerings: StServiceOffering[] = source.value() ?? [];
    return [...offerings].sort((a, b) => naturalCompare(a?.name ?? '', b?.name ?? ''));
  });

  readonly isFetching: Signal<boolean> = computed(() => !!this.offeringsSource()?.isLoading());

  cfGuid!: string;
  stepperForm: FormGroup<SelectServiceForm>;
  validate = signal<boolean>(false);
  readonly selectedService: Signal<StServiceOffering | undefined>;

  private readonly destroyRef = inject(DestroyRef);
  public errorMessage: string | null = null;

  // Effect to track form validation status - runs in injection context
  private readonly formValidationEffect = effect(() => {
    // Track form status via signal
    const isValid = this.stepperForm.controls.service.valid;
    this.validate.set(isValid);
  });

  // Effect: rebuild the offerings SignalSource when csiState's
  // (cfGuid, spaceGuid) pair stabilises. Replaces the legacy
  // ngrx-pagination + RxJS switchMap chain.
  private readonly fetchEffect = effect(() => {
    const state = this.csiState.state();
    const cfGuid = state?.cfGuid;
    const spaceGuid = state?.spaceGuid;
    if (!cfGuid || !spaceGuid) {
      this.offeringsSource.set(null);
      return;
    }
    this.cfGuid = cfGuid;
    this.offeringsSource.set(this.servicesWallService.getServicesInSpaceSource(cfGuid, spaceGuid));
  });

  // Effect: disable/enable the stepper form based on the SignalSource's
  // loading state. Replaces the legacy paginationMonitor.fetchingCurrentPage$.
  private readonly formGateEffect = effect(() => {
    if (this.isFetching()) {
      this.stepperForm?.disable();
    } else {
      this.stepperForm?.enable();
    }
  });

  // Effect: auto-pick when the list collapses to one entry; clear the
  // error message when the list arrives non-empty.
  private readonly autoPickEffect = effect(() => {
    const source = this.offeringsSource();
    if (!source || source.isLoading()) return;
    const services = this.services();
    if (services.length === 1) {
      const guid = services[0]?.guid;
      if (guid) {
        this.stepperForm.controls.service.setValue(guid);
      }
    } else if (services.length === 0) {
      this.errorMessage = 'No services available in this space.';
    }
  });

  constructor() {
    this.stepperForm = new FormGroup<SelectServiceForm>({
      service: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    });

    const serviceControl = this.stepperForm.controls.service;
    const serviceGuid = toSignal(serviceControl.valueChanges, { initialValue: serviceControl.value });
    this.selectedService = computed(() => this.services().find(a => a?.guid === serviceGuid()));
  }

  async onNext(): Promise<StepOnNextResult> {
    const serviceGuid = this.stepperForm.controls.service.value;
    this.csiState.setServiceGuid(serviceGuid);
    this.csiGuidService.serviceGuid = serviceGuid;
    this.csiGuidService.cfGuid = this.cfGuid;
    return { success: true };
  }

  ngAfterContentInit() {
    // Effect now runs as field initializer above
    // Original observable subscription for validation (kept for compatibility)
    this.stepperForm.controls.service.statusChanges.pipe(
      map(() => this.validate.set(this.stepperForm.controls.service.valid)),
      catchError(error => {
        console.error('Error tracking form validation:', error);
        return observableOf(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
