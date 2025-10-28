import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, Observable, of as observableOf, Subject } from 'rxjs';
import { catchError, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { StepOnNextResult } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import { SetCreateServiceInstanceServiceGuid } from '../../../actions/create-service-instance.actions';
import { IService } from '../../../cf-api-svc.types';
import { CFAppState } from '../../../cf-app-state';
import { cfEntityFactory } from '../../../cf-entity-factory';
import { serviceEntityType } from '../../../cf-entity-types';
import { ServicesWallService } from '../../../features/services/services/services-wall.service';
import {
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceSpaceGuid,
} from '../../../store/selectors/create-service-instance.selectors';
import { CfServiceCardComponent } from '../list/list-types/cf-services/cf-service-card/cf-service-card.component';
import { CsiGuidsService } from '../add-service-instance/csi-guids.service';


@Component({
  selector: 'app-select-service',
  templateUrl: './select-service.component.html',
  styleUrls: ['./select-service.component.scss'],
  providers: [
    ServicesWallService
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    CfServiceCardComponent
  ]
})
export class SelectServiceComponent implements OnDestroy, AfterContentInit {
  cfGuid: string;
  services$: Observable<APIResource<IService>[]>;
  stepperForm: UntypedFormGroup;
  validate: BehaviorSubject<boolean> = new BehaviorSubject(false);
  isFetching$: Observable<boolean>;
  selectedService$: Observable<APIResource<IService>>;

  // Lifecycle management for subscriptions
  private destroyed$ = new Subject<void>();
  public errorMessage: string | null = null;

  constructor(
    private store: Store<CFAppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private csiGuidService: CsiGuidsService,
    private servicesWallService: ServicesWallService
  ) {
    this.stepperForm = new UntypedFormGroup({
      service: new UntypedFormControl('', [Validators.required as any]),
    });

    const cfSpaceGuid$ =
      combineLatest([
        this.store.select(selectCreateServiceInstanceCfGuid),
        this.store.select(selectCreateServiceInstanceSpaceGuid)
      ]).pipe(
        filter(([p, q]) => !!p && !!q),
        takeUntil(this.destroyed$)
      );

    const schema = cfEntityFactory(serviceEntityType);
    this.isFetching$ = cfSpaceGuid$.pipe(
      switchMap(([cfGuid, spaceGuid]) => {
        const paginationKey = this.servicesWallService.getSpaceServicePagKey(cfGuid, spaceGuid);
        const paginationMonitor = this.paginationMonitorFactory.create(paginationKey, schema, false);
        return paginationMonitor.fetchingCurrentPage$;
      }),
      tap(fetching => {
        fetching ? this.stepperForm.disable() : this.stepperForm.enable();
      }),
      catchError(error => {
        console.error('Error monitoring service fetch status:', error);
        this.stepperForm.enable();
        return observableOf(false);
      }),
      takeUntil(this.destroyed$)
    );

    this.services$ = cfSpaceGuid$.pipe(
      tap(([cfGuid]) => this.cfGuid = cfGuid),
      switchMap(([cfGuid, spaceGuid]) => this.servicesWallService.getServicesInSpace(cfGuid, spaceGuid)),
      filter(p => !!p),
      map(services => services.sort((a, b) => a?.entity?.label?.localeCompare(b?.entity?.label || '') || 0)),
      tap(services => {
        if (services.length === 1) {
          const guid = services[0]?.metadata?.guid;
          if (guid) {
            this.stepperForm.controls.service.setValue(guid);
          }
        } else if (services.length === 0) {
          this.errorMessage = 'No services available in this space.';
        }
      }),
      catchError(error => {
        console.error('Error fetching services:', error);
        this.errorMessage = 'Failed to fetch services. Please try again.';
        this.stepperForm.enable();
        return observableOf([]);
      }),
      takeUntil(this.destroyed$)
    );

    this.selectedService$ = combineLatest([
      this.services$,
      this.stepperForm.controls.service.statusChanges
    ]).pipe(
      map(([services, change]) => services.filter(a => a?.metadata?.guid === this.stepperForm.controls.service.value)[0]),
      filter(p => !!p),
      takeUntil(this.destroyed$)
    );
  }

  onNext = (): Observable<StepOnNextResult> => {
    const serviceGuid = this.stepperForm.controls.service.value;
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceGuid));
    this.csiGuidService.serviceGuid = serviceGuid;
    this.csiGuidService.cfGuid = this.cfGuid;
    return observableOf({ success: true });
  }

  ngAfterContentInit() {
    // Validate step based on form status
    this.stepperForm.controls.service.statusChanges.pipe(
      map(() => this.validate.next(this.stepperForm.controls.service.valid)),
      takeUntil(this.destroyed$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
