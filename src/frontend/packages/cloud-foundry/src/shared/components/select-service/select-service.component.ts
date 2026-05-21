import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, of as observableOf, Subject } from 'rxjs';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';

import { CustomFormFieldComponent, MatLabelComponent, CustomSelectComponent, CustomOptionComponent, StepOnNextResult } from '@stratosui/core';
import { ServicesWallService } from '../../../features/services/services/services-wall.service';
import { StServiceOffering } from '../../../services/endpoint-data/stratos-types';
import { CfServiceCardComponent } from '../list/list-types/cf-services/cf-service-card/cf-service-card.component';
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
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CfServiceCardComponent
  ]
})
export class SelectServiceComponent implements OnDestroy, AfterContentInit {
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
    return [...offerings].sort((a, b) => (a?.name ?? '').localeCompare(b?.name ?? ''));
  });
  // Bridge the signal to Observable for the template's `services$ |
  // async` binding (and downstream RxJS composition below).
  services$: Observable<StServiceOffering[]> = toObservable(this.services);

  readonly isFetching: Signal<boolean> = computed(() => !!this.offeringsSource()?.isLoading());
  isFetching$: Observable<boolean> = toObservable(this.isFetching);

  cfGuid!: string;
  stepperForm: FormGroup<SelectServiceForm>;
  validate = signal<boolean>(false);
  selectedService$: Observable<StServiceOffering>;

  // Lifecycle management for subscriptions
  private destroyed$ = new Subject<void>();
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

    this.selectedService$ = combineLatest([
      this.services$,
      this.stepperForm.controls.service.statusChanges
    ]).pipe(
      map(([services, _change]) => services.filter(a => a?.guid === this.stepperForm.controls.service.value)[0]),
      filter(p => !!p),
      takeUntil(this.destroyed$)
    );
  }

  onNext = (): Observable<StepOnNextResult> => {
    const serviceGuid = this.stepperForm.controls.service.value;
    this.csiState.setServiceGuid(serviceGuid);
    this.csiGuidService.serviceGuid = serviceGuid;
    this.csiGuidService.cfGuid = this.cfGuid;
    return observableOf({ success: true });
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
      takeUntil(this.destroyed$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
