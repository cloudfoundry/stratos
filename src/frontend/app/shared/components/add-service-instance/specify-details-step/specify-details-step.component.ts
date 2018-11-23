import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
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
  tap
} from 'rxjs/operators';
import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { getServiceJsonParams } from '../../../../features/service-catalog/services-helper';
import { GetAppEnvVarsAction } from '../../../../store/actions/app-metadata.actions';
import { SetCreateServiceInstanceOrg, SetServiceInstanceGuid } from '../../../../store/actions/create-service-instance.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { CreateServiceBinding } from '../../../../store/actions/service-bindings.actions';
import { CreateServiceInstance, GetServiceInstance, UpdateServiceInstance } from '../../../../store/actions/service-instances.actions';
import { AppState } from '../../../../store/app-state';
import { serviceBindingSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { RequestInfoState } from '../../../../store/reducers/api-request-reducer/types';
import { selectRequestInfo, selectUpdateInfo } from '../../../../store/selectors/api.selectors';
import {
  selectCreateServiceInstance,
  selectCreateServiceInstanceSpaceGuid
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource, NormalizedResponse } from '../../../../store/types/api.types';
import { CreateServiceInstanceState } from '../../../../store/types/create-service-instance.types';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';


const enum FormMode {
  CreateServiceInstance = 'create-service-instance',
  BindServiceInstance = 'bind-service-instance',
}
@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnDestroy, AfterContentInit {

  serviceInstancesInit$: Observable<boolean>;
  hasInstances$: Observable<boolean>;
  serviceInstanceName: string;
  serviceInstanceGuid: string;
  selectCreateInstance$: Observable<CreateServiceInstanceState>;
  formModes = [
    {
      label: 'Create and Bind to a new Service Instance',
      key: FormMode.CreateServiceInstance
    },
    {
      label: 'Bind to an Existing Service Instance',
      key: FormMode.BindServiceInstance
    }
  ];
  @Input()
  showModeSelection = false;

  @Input() appId: string;

  formMode: FormMode;

  selectExistingInstanceForm: FormGroup;
  createNewInstanceForm: FormGroup;
  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  bindableServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  cSIHelperService: CreateServiceInstanceHelper;
  allServiceInstances$: Observable<APIResource<IServiceInstance>[]>;
  validate: BehaviorSubject<boolean> = new BehaviorSubject(false);
  allServiceInstanceNames: string[];
  tagsVisible = true;
  tagsSelectable = true;
  tagsRemovable = true;
  tagsAddOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA, SPACE];
  tags = [];
  spaceScopeSub: Subscription;
  bindExistingInstance = false;
  subscriptions: Subscription[] = [];

  static isValidJsonValidatorFn = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {

      try {
        if (formField.value) {
          const jsonObj = JSON.parse(formField.value);
          // Check if jsonObj is actually an obj
          if (jsonObj.constructor !== {}.constructor) {
            throw new Error('not an object');
          }
        }
      } catch (e) {
        return { 'notValidJson': { value: formField.value } };
      }
      return null;
    };
  }
  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.checkName(formField.value) ? { 'nameTaken': { value: formField.value } } : null;
  }

  constructor(
    private store: Store<AppState>,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private csiGuidsService: CsiGuidsService,
    public modeService: CsiModeService
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
      map(o => false),
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
          const updated = [];
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

  onEnter = () => {
    this.formMode = FormMode.CreateServiceInstance;
    this.allServiceInstances$ = this.cSIHelperService.getServiceInstancesForService(null, null, this.csiGuidsService.cfGuid);
    if (this.modeService.isEditServiceInstanceMode()) {
      this.store.select(selectCreateServiceInstance).pipe(
        take(1),
        tap(state => {
          this.createNewInstanceForm.controls.name.setValue(state.name);
          this.createNewInstanceForm.controls.params.setValue(state.parameters);
          this.serviceInstanceGuid = state.serviceInstanceGuid;
          this.serviceInstanceName = state.name;
          this.createNewInstanceForm.updateValueAndValidity();
          if (state.tags) {
            this.tags = [].concat(state.tags.map(t => ({ label: t })));
          }
        })
      ).subscribe();
    }
    this.subscriptions.push(this.setupFormValidatorData());
  }

  resetForms = (mode: FormMode) => {
    this.validate.next(false);
    this.createNewInstanceForm.reset();
    this.selectExistingInstanceForm.reset();
    if (mode === FormMode.CreateServiceInstance) {
      this.tags = [];
      this.bindExistingInstance = false;
    } else if (mode === FormMode.BindServiceInstance) {
      this.bindExistingInstance = true;
    }
  }

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
      })).subscribe();
  }

  private setupForms() {
    this.createNewInstanceForm = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator()]),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
      tags: new FormControl(''),
    });
    this.selectExistingInstanceForm = new FormGroup({
      serviceInstances: new FormControl('', [Validators.required]),
    });
  }

  setOrg = (guid) => this.store.dispatch(new SetCreateServiceInstanceOrg(guid));

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  ngAfterContentInit() {
    this.setupValidate();
  }

  onNext = (): Observable<StepOnNextResult> => {
    return this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p),
      switchMap(p => {
        if (this.bindExistingInstance) {
          // Binding an existing instance, therefore, skip creation by returning a dummy response
          return observableOf({
            creating: false,
            error: false,
            fetching: false,
            response: {
              result: []
            }
          });
        } else {
          return this.createServiceInstance(p);
        }
      }),
      filter(s => !s.creating && !s.fetching),
      combineLatest(this.store.select(selectCreateServiceInstance)),
      first(),
      switchMap(([request, state]) => {
        if (this.modeService.isEditServiceInstanceMode()) {
          const updatingInfo = request.updating[UpdateServiceInstance.updateServiceInstance];
          if (!!updatingInfo && updatingInfo.error) {
            return observableOf({
              success: false,
              message: `Failed to update service instance.`
            });
          }
        } else if (request.error) {
          return observableOf({ success: false, message: `Failed to create service instance: ${request.message}` });
        }
        if (!this.modeService.isEditServiceInstanceMode()) {
          const serviceInstanceGuid = this.setServiceInstanceGuid(request);
          this.store.dispatch(new SetServiceInstanceGuid(serviceInstanceGuid));
          if (!!state.bindAppGuid) {
            return this.createBinding(serviceInstanceGuid, state.cfGuid, state.bindAppGuid, state.bindAppParams)
              .pipe(
                filter(s => {
                  return s && !s.creating;
                }),
                map(req => {
                  if (req.error) {
                    return { success: false, message: `Failed to create service instance binding: ${req.message}` };
                  } else {
                    // Refetch env vars for app, since they have been changed by CF
                    this.store.dispatch(
                      new GetAppEnvVarsAction(state.bindAppGuid, state.cfGuid)
                    );

                    return this.routeToServices(state.cfGuid, state.bindAppGuid);
                  }
                })
              );
          } else {
            return observableOf(this.routeToServices());
          }
        }
        return observableOf(this.routeToServices());
      }),
    );
  }

  routeToServices = (cfGuid: string = null, appGuid: string = null): StepOnNextResult => {
    if (this.modeService.isAppServicesMode()) {
      this.store.dispatch(new RouterNav({ path: ['/applications', cfGuid, appGuid, 'services'] }));
    } else {
      this.store.dispatch(new RouterNav({ path: ['/services'] }));
    }
    return { success: true };
  }

  private setServiceInstanceGuid = (request: { creating: boolean; error: boolean; response: { result: any[]; }; }) =>
    this.bindExistingInstance ? this.selectExistingInstanceForm.controls.serviceInstances.value : request.response.result[0]

  private setupValidate() {
    this.subscriptions.push(this.createNewInstanceForm.statusChanges.pipe(
      map(() => this.validate.next(this.createNewInstanceForm.valid))).subscribe());
    this.subscriptions.push(this.selectExistingInstanceForm.statusChanges.pipe(
      map(() => this.validate.next(this.selectExistingInstanceForm.valid))).subscribe());
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
    const actionState = selectUpdateInfo(serviceInstancesSchemaKey,
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
      return new UpdateServiceInstance(cfGuid, newServiceInstanceGuid, name, servicePlanGuid, spaceGuid, params, tagsStr);
    }
    return new CreateServiceInstance(cfGuid, newServiceInstanceGuid, name, servicePlanGuid, spaceGuid, params, tagsStr);
  }

  private getIdFromResponseGetter(cfGuid: string, newId: string, isEditMode: boolean) {
    return (response: NormalizedResponse) => {
      if (!isEditMode) {
        // We need to re-fetch the Service Instance
        // incase of creation because the entity returned is incomplete
        const guid = response.result[0];
        this.store.dispatch(new GetServiceInstance(guid, cfGuid));
        return guid;
      }
      return newId;
    };
  }

  createServiceInstance(createServiceInstance: CreateServiceInstanceState): Observable<RequestInfoState> {

    const name = this.createNewInstanceForm.controls.name.value;
    const { spaceGuid, cfGuid } = createServiceInstance;
    const servicePlanGuid = createServiceInstance.servicePlanGuid;
    const params = getServiceJsonParams(this.createNewInstanceForm.controls.params.value);
    let tagsStr = null;
    tagsStr = this.tags.length > 0 ? this.tags.map(t => t.label) : [];

    const newServiceInstanceGuid = this.getNewServiceGuid(name, spaceGuid, servicePlanGuid);

    const isEditMode = this.modeService.isEditServiceInstanceMode();
    const checkUpdate$ = this.getUpdateObservable(isEditMode, newServiceInstanceGuid);
    const action = this.getAction(cfGuid, newServiceInstanceGuid, name, servicePlanGuid, spaceGuid, params, tagsStr, isEditMode);

    const create$ = this.store.select(selectRequestInfo(serviceInstancesSchemaKey, newServiceInstanceGuid));
    const getIdFromResponse = this.getIdFromResponseGetter(cfGuid, newServiceInstanceGuid, isEditMode);

    this.store.dispatch(action);
    return checkUpdate$.pipe(
      switchMap(o => create$),
      filter(a => !a.creating),
      switchMap(a => {
        const updating = a.updating ? a.updating[UpdateServiceInstance.updateServiceInstance] : null;
        if ((isEditMode && !!updating && updating.error) || (a.error)) {
          return create$;
        }

        const guid = getIdFromResponse(a.response as NormalizedResponse);

        return this.store.select(selectRequestInfo(serviceInstancesSchemaKey, guid)).pipe(
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


  createBinding = (serviceInstanceGuid: string, cfGuid: string, appGuid: string, params: {}) => {

    const guid = `${cfGuid}-${appGuid}-${serviceInstanceGuid}`;
    params = getServiceJsonParams(params);

    this.store.dispatch(new CreateServiceBinding(
      cfGuid,
      guid,
      appGuid,
      serviceInstanceGuid,
      params
    ));

    return this.store.select(selectRequestInfo(serviceBindingSchemaKey, guid));
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      this.tags.push({ label: value.trim() });
    }

    if (input) {
      input.value = '';
    }
  }

  removeTag(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
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
  }

}
