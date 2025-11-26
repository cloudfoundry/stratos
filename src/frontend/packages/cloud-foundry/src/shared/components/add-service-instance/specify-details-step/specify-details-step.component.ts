import { CommonModule, AsyncPipe } from '@angular/common';
import { CustomFormFieldComponent, MatLabelComponent, AppInputDirective, AppErrorComponent } from '@stratosui/core';
import { AfterContentInit, Component, Input, OnDestroy, signal,
  ChangeDetectionStrategy} from '@angular/core';
import { AbstractControl, ValidatorFn, Validators, ReactiveFormsModule, FormsModule, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { Store } from '@ngrx/store';
import {
  combineLatest as observableCombineLatest,
  type Observable,
  of as observableOf,
  type Subscription,
} from 'rxjs';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  share,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import {
  SetCreateServiceInstanceOrg,
  SetServiceInstanceGuid,
} from '../../../../../../cloud-foundry/src/actions/create-service-instance.actions';
import { pathGet, safeStringToObj } from '@stratosui/core';
import type { StepOnNextResult } from '@stratosui/core';
import { getDefaultRequestState, type RequestInfoState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import type { APIResource, NormalizedResponse } from '../../../../../../store/src/types/api.types';
import { UpdateServiceInstance } from '../../../../actions/service-instances.actions';
import type { IServiceInstance, IServicePlan } from '../../../../cf-api-svc.types';
import type { CFAppState } from '../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { serviceInstancesEntityType } from '../../../../cf-entity-types';
import { selectCfRequestInfo, selectCfUpdateInfo } from '../../../../store/selectors/api.selectors';
import {
  selectCreateServiceInstance,
  selectCreateServiceInstanceSpaceGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import type { CreateServiceInstanceState } from '../../../../store/types/create-service-instance.types';
import { LongRunningCfOperationsService } from '../../../data-services/long-running-cf-op.service';
import { SchemaFormComponent, type SchemaFormConfig } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import type { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CreateServiceFormMode, CsiModeService } from '../csi-mode.service';

interface SelectExistingInstanceForm {
  serviceInstance: string;
}

interface CreateNewInstanceForm {
  name: string;
  servicePlan: string;
  spaceGuid: string;
  params: object;
  tags: string;
}

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    SchemaFormComponent,
    AppInputDirective,
    AppErrorComponent
  ]
})
export class SpecifyDetailsStepComponent implements OnDestroy, AfterContentInit {

  serviceInstancesInit$: Observable<boolean>;
  hasInstances$: Observable<boolean>;
  serviceInstanceName!: string;
  serviceInstanceGuid!: string;
  selectCreateInstance$: Observable<CreateServiceInstanceState>;
  formModes = [
    {
      label: 'Create and Bind to a new Service Instance',
      key: CreateServiceFormMode.CreateServiceInstance
    },
    {
      label: 'Bind to an Existing Service Instance',
      key: CreateServiceFormMode.BindServiceInstance
    }
  ];
  @Input()
  showModeSelection = false;

  @Input() appId!: string;

  formMode!: CreateServiceFormMode;

  selectExistingInstanceForm!: FormGroup<{
    serviceInstance: FormControl<string>;
  }>;
  createNewInstanceForm!: FormGroup<{
    name: FormControl<string>;
    servicePlan: FormControl<string>;
    spaceGuid: FormControl<string>;
    params: FormControl<object>;
    tags: FormControl<string[]>;
  }>;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  bindableServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  cSIHelperService!: CreateServiceInstanceHelper;
  allServiceInstances$!: Observable<APIResource<IServiceInstance>[]>;
  private _validate = signal<boolean>(false);
  validate = toObservable(this._validate);
  allServiceInstanceNames!: string[];
  tagsVisible = true;
  tagsSelectable = true;
  tagsRemovable = true;
  tagsAddOnBlur = true;
  tags: string[] = [];
  spaceScopeSub!: Subscription;
  bindExistingInstance = false;
  subscriptions: Subscription[] = [];
  private _serviceParamsValid = signal<boolean>(false);
  serviceParamsValid = toObservable(this._serviceParamsValid);
  serviceParams: object = {};
  schemaFormConfig!: SchemaFormConfig;


  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: unknown } | null =>
      !this.checkName(formField.value) ? { nameTaken: { value: formField.value } } : null;
  };

  constructor(
    private store: Store,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private csiGuidsService: CsiGuidsService,
    public modeService: CsiModeService,
    public longRunningOpService: LongRunningCfOperationsService
  ) {
    this.setupForms();

    this.selectCreateInstance$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.servicePlanGuid && !!p.spaceGuid && !!p.cfGuid && !!p.serviceGuid),
      share(),
    );
    this.serviceInstances$ = this.selectCreateInstance$.pipe(
      distinctUntilChanged((x, y) => {
        return (x.servicePlanGuid === y.servicePlanGuid && x.spaceGuid === y.spaceGuid);
      }),
      switchMap(guids => {
        this.cSIHelperService = this.cSIHelperServiceFactory.create(guids.cfGuid, guids.serviceGuid);
        return this.cSIHelperService.getServiceInstancesForService(
          guids.servicePlanGuid,
          guids.spaceGuid,
          guids.cfGuid
        );
      }),
      publishReplay(1),
      refCount(),
    );

    this.serviceInstancesInit$ = this.serviceInstances$.pipe(
      filter(p => !!p),
      map(_o => false),
      startWith(false)
    );
    this.hasInstances$ = this.serviceInstances$.pipe(
      filter(p => !!p),
      map(p => p.length > 0),
    );

    this.bindableServiceInstances$ = this.serviceInstances$.pipe(
      map(svcs => {
        if (!this.appId) {
          return svcs;
        } else {
          const updated: APIResource<IServiceInstance>[] = [];
          svcs.forEach(svc => {
            const alreadyBound = !!svc.entity.service_bindings.find(binding => binding.entity.app_guid === this.appId);
            if (alreadyBound) {
              const updatedSvc: APIResource<IServiceInstance> = {
                entity: { ...svc.entity },
                metadata: { ...svc.metadata }
              };
              updatedSvc.entity.name += ' (Already bound)';
              updatedSvc.metadata.guid = null;
              updated.push(updatedSvc);
            } else {
              updated.push(svc);
            }
          });
          return updated;
        }
      })
    );
  }

  onEnter = (selectedServicePlan: APIResource<IServicePlan>) => {
    const schema = this.modeService.isEditServiceInstanceMode() ?
      pathGet('entity.schemas.service_instance.update.parameters', selectedServicePlan) as object :
      pathGet('entity.schemas.service_instance.create.parameters', selectedServicePlan) as object;

    if (!this.schemaFormConfig) {
      // Create new config
      this.schemaFormConfig = {
        schema
      };
    } else {
      // Update existing config (retaining any existing config)
      this.schemaFormConfig = {
        ...this.schemaFormConfig,
        initialData: this.serviceParams,
        schema
      };
    }

    this.formMode = CreateServiceFormMode.CreateServiceInstance;
    this.allServiceInstances$ = this.cSIHelperService.getServiceInstancesForService(null, null, this.csiGuidsService.cfGuid);
    if (this.modeService.isEditServiceInstanceMode()) {
      this.store.select(selectCreateServiceInstance).pipe(
        take(1),
        tap(state => {
          this.createNewInstanceForm.controls.name.setValue(state.name);

          this.schemaFormConfig.initialData = safeStringToObj(state.parameters) || this.serviceParams;

          this.serviceInstanceGuid = state.serviceInstanceGuid;
          this.serviceInstanceName = state.name;
          this.createNewInstanceForm.updateValueAndValidity();
          if (state.tags) {
            this.tags = [].concat(state.tags);
          }
        })
      ).subscribe();
    }
    this.subscriptions.push(this.setupFormValidatorData());
  };

  setServiceParams(data: object) {
    this.serviceParams = data;
  }

  setParamsValid(valid: boolean) {
    this._serviceParamsValid.set(valid);
  }

  resetForms = (mode: CreateServiceFormMode) => {
    this._validate.set(false);
    this.createNewInstanceForm.reset();
    this.selectExistingInstanceForm.reset();
    if (mode === CreateServiceFormMode.CreateServiceInstance) {
      this.tags = [];
      this.bindExistingInstance = false;
    } else if (mode === CreateServiceFormMode.BindServiceInstance) {
      this.bindExistingInstance = true;
    }
  };

  private setupFormValidatorData(): Subscription {
    return this.allServiceInstances$.pipe(
      combineLatest(this.store.select(selectCreateServiceInstance)),
      switchMap(([instances, state]) => {
        return this.store.select(selectCreateServiceInstanceSpaceGuid).pipe(
          filter(p => !!p),
          map(spaceGuid => instances.filter(s => {
            let filterSelf = false;
            if (this.modeService.isEditServiceInstanceMode()) {
              filterSelf = s.entity.name === state.name;
            }
            return (s.entity.space_guid === spaceGuid) && !filterSelf;

          }
          )), tap(o => {
            this.allServiceInstanceNames = o.map(s => s.entity.name);
          }));
      })
    ).subscribe();
  }

  private setupForms() {
    this.createNewInstanceForm = new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator(), Validators.maxLength(50)] }),
      servicePlan: new FormControl('', { nonNullable: true }),
      spaceGuid: new FormControl('', { nonNullable: true }),
      params: new FormControl({}, { nonNullable: true }),
      tags: new FormControl<string[]>([], { nonNullable: true }),
    });
    this.selectExistingInstanceForm = new FormGroup({
      serviceInstance: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
  }

  setOrg = (guid: string) => this.store.dispatch(new SetCreateServiceInstanceOrg(guid));

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  ngAfterContentInit() {
    this.setupValidate();
  }

  private handleUpdateServiceResult(request: RequestInfoState, state: CreateServiceInstanceState): Observable<StepOnNextResult> {
    const updatingInfo = request.updating[UpdateServiceInstance.updateServiceInstance];
    if (!updatingInfo) {
      // This isn't an update
    } else if (this.longRunningOpService.isLongRunning(updatingInfo)) {
      // This request has taken too long for the browser/jetstream and is on going. Treat this as a success
      this.longRunningOpService.handleLongRunningUpdateService(state.serviceInstanceGuid, state.cfGuid);
    } else if (updatingInfo.error) {
      // The request has errored, report this back
      return observableOf({ success: false, message: `Failed to update service instance: ${updatingInfo.message}` });
    }
  }

  private handleCreateServiceResult(request: RequestInfoState, state: CreateServiceInstanceState): Observable<StepOnNextResult> {
    const bindApp = !!state.bindAppGuid;

    if (this.longRunningOpService.isLongRunning(request)) {
      // This request has taken too long for the browser/jetstream and is on going. Treat this as a success
      this.longRunningOpService.handleLongRunningCreateService(bindApp);
      // Return to app page instead of falling through to service page
      if (bindApp) {
        return observableOf(this.routeToServices());
      }
    } else if (request.error) {
      // The request has errored, report this back
      return observableOf({ success: false, message: `Failed to create service instance: ${request.message}` });
    } else if (bindApp) {
      // The request has succeeded and we now need to bind an app to the new service instance
      const serviceInstanceGuid = this.setServiceInstanceGuid(request);
      this.store.dispatch(new SetServiceInstanceGuid(serviceInstanceGuid));
      return this.modeService.createApplicationServiceBinding(
        serviceInstanceGuid,
        state.cfGuid,
        state.bindAppGuid,
        state.bindAppParams
      ).pipe(
        map(req => {
          if (!req.success) {
            return req;
          } else {
            // Refetch env vars for app, since they have been changed by CF
            cfEntityCatalog.appEnvVar.api.getMultiple(state.bindAppGuid, state.cfGuid);
            return this.routeToServices();
          }
        })
      );
    }
  }

  onNext = (): Observable<StepOnNextResult> => {
    return this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p),
      switchMap(p => {
        if (this.bindExistingInstance) {
          // Binding an existing instance, therefore, skip creation by returning a dummy response
          return observableOf<RequestInfoState>(getDefaultRequestState());
        } else {
          return this.createServiceInstance(p);
        }
      }),
      filter(s => !s.creating && !s.fetching),
      combineLatest(this.store.select(selectCreateServiceInstance)),
      first(),
      switchMap(([request, state]) => {

        const handleEditServiceResult = this.handleUpdateServiceResult(request, state);
        if (handleEditServiceResult) {
          return handleEditServiceResult;
        }

        const handleCreateServiceResult = this.handleCreateServiceResult(request, state);
        if (handleCreateServiceResult) {
          return handleCreateServiceResult;
        }

        return observableOf(this.routeToServices());
      }),
    );
  };

  routeToServices = (): StepOnNextResult => {
    return {
      success: true,
      // We should always go back to where we came from, aka 'cancel' location.
      redirect: true,
    };
  };

  private setServiceInstanceGuid = (request: RequestInfoState): string | undefined =>
    this.bindExistingInstance ? this.selectExistingInstanceForm.controls.serviceInstance.value : (request.response as NormalizedResponse)?.result?.[0];

  private setupValidate() {
    // For a new service instance the step is valid if the form and service params are both valid
    this.subscriptions.push(
      observableCombineLatest([
        this.serviceParamsValid,
        this.createNewInstanceForm.statusChanges
      ]).pipe(
        map(([serviceParamsValid, _b]) => this._validate.set(serviceParamsValid && this.createNewInstanceForm.valid))
      ).subscribe()
    );
    // For existing service instance the step is valid if the form is (there's no service params)
    this.subscriptions.push(this.selectExistingInstanceForm.statusChanges.pipe(
      map(() => this._validate.set(this.selectExistingInstanceForm.valid))
    ).subscribe());
  }

  private getNewServiceGuid(name: string, spaceGuid: string, servicePlanGuid: string) {
    if (!this.modeService.isEditServiceInstanceMode()) {
      return name + spaceGuid + servicePlanGuid;
    } else {
      return this.serviceInstanceGuid;
    }
  }

  private getUpdateObservable(isEditMode: boolean, newServiceInstanceGuid: string) {
    if (!isEditMode) {
      return observableOf(null);
    }
    const actionState = selectCfUpdateInfo(serviceInstancesEntityType,
      newServiceInstanceGuid,
      UpdateServiceInstance.updateServiceInstance
    );
    return this.store.select(actionState).pipe(
      filter(i => !i.busy)
    );
  }

  private getAction(
    cfGuid: string,
    newServiceInstanceGuid: string,
    name: string,
    servicePlanGuid: string,
    spaceGuid: string,
    params: {},
    tagsStr: string[],
    isEditMode: boolean
  ) {
    if (isEditMode) {
      return cfEntityCatalog.serviceInstance.actions.update(
        newServiceInstanceGuid,
        cfGuid,
        { name, servicePlanGuid, spaceGuid, params, tags: tagsStr }
      );
    }
    return cfEntityCatalog.serviceInstance.actions.create(
      newServiceInstanceGuid,
      cfGuid,
      { name, servicePlanGuid, spaceGuid, params, tags: tagsStr }
    );
  }

  private getIdFromResponseGetter(cfGuid: string, newId: string, isEditMode: boolean) {
    return (response: NormalizedResponse) => {
      if (!isEditMode) {
        // We need to re-fetch the Service Instance in case of creation because the entity returned is incomplete
        const guid = response.result[0];
        cfEntityCatalog.serviceInstance.api.get(guid, cfGuid);
        return guid;
      }
      return newId;
    };
  }

  createServiceInstance(createServiceInstance: CreateServiceInstanceState): Observable<RequestInfoState> {

    const name = this.createNewInstanceForm.controls.name.value;
    const { spaceGuid, cfGuid } = createServiceInstance;
    const servicePlanGuid = createServiceInstance.servicePlanGuid;
    const params = this.serviceParams;
    const tagsStr: string[] = this.tags.length > 0 ? this.tags : [];

    const newServiceInstanceGuid = this.getNewServiceGuid(name, spaceGuid, servicePlanGuid);

    const isEditMode = this.modeService.isEditServiceInstanceMode();
    const checkUpdate$ = this.getUpdateObservable(isEditMode, newServiceInstanceGuid);
    const action = this.getAction(cfGuid, newServiceInstanceGuid, name, servicePlanGuid, spaceGuid, params, tagsStr, isEditMode);

    const create$ = this.store.select(selectCfRequestInfo(serviceInstancesEntityType, newServiceInstanceGuid));
    const getIdFromResponse = this.getIdFromResponseGetter(cfGuid, newServiceInstanceGuid, isEditMode);

    this.store.dispatch(action);
    return checkUpdate$.pipe(
      switchMap(_o => create$),
      filter(a => !a.creating),
      switchMap(a => {
        const updating = a.updating ? a.updating[UpdateServiceInstance.updateServiceInstance] : null;
        if ((isEditMode && !!updating && updating.error) || (a.error)) {
          return create$;
        }

        const guid = getIdFromResponse(a.response as NormalizedResponse);

        return this.store.select(selectCfRequestInfo(serviceInstancesEntityType, guid)).pipe(
          map(ri => ({
            ...ri,
            response: {
              result: [guid]
            }
          }))
        );
      })
    );
  }

  addTagFromInput(event: KeyboardEvent): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if ((value || '').trim()) {
      this.tags.push(value.trim());
      this.updateTagsFormControl();
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
      this.updateTagsFormControl();
    }
  }

  private updateTagsFormControl(): void {
    this.createNewInstanceForm.controls.tags.setValue(this.tags);
    this.createNewInstanceForm.controls.tags.markAsTouched();
  }

  checkName = (value: string = null) => {
    if (this.allServiceInstanceNames) {
      const specifiedName = value || this.createNewInstanceForm.controls.name.value;
      if (this.modeService.isEditServiceInstanceMode() && specifiedName === this.serviceInstanceName) {
        return true;
      }
      return this.allServiceInstanceNames.indexOf(value || this.createNewInstanceForm.controls.name.value) === -1;
    }
    return true;
  };

}
