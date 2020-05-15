import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest as obsCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { combineLatest, filter, first, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';

import { IUserProvidedServiceInstanceData } from '../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  serviceBindingEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  selectCreateServiceInstance,
} from '../../../../../../cloud-foundry/src/store/selectors/create-service-instance.selectors';
import { safeUnsubscribe, urlValidationExpression } from '../../../../../../core/src/core/utils.service';
import { environment } from '../../../../../../core/src/environments/environment';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { isValidJsonValidator } from '../../../../../../core/src/shared/form-validators';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IUserProvidedServiceInstance } from '../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { AppNameUniqueChecking } from '../../../directives/app-name-unique.directive/app-name-unique.directive';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { CreateServiceFormMode, CsiModeService } from './../csi-mode.service';

const { proxyAPIVersion, cfAPIVersion } = environment;
@Component({
  selector: 'app-specify-user-provided-details',
  templateUrl: './specify-user-provided-details.component.html',
  styleUrls: ['./specify-user-provided-details.component.scss']
})
export class SpecifyUserProvidedDetailsComponent implements OnDestroy {

  constructor(
    route: ActivatedRoute,
    private upsService: CloudFoundryUserProvidedServicesService,
    public modeService: CsiModeService,
    private store: Store<CFAppState>,
  ) {
    const { endpointId, serviceInstanceId } =
      route && route.snapshot ? route.snapshot.params : { endpointId: null, serviceInstanceId: null };
    this.isUpdate = endpointId && serviceInstanceId;

    this.createEditServiceInstance = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      syslog_drain_url: new FormControl('', [Validators.pattern(urlValidationExpression)]),
      credentials: new FormControl('', isValidJsonValidator()),
      route_service_url: new FormControl('', [Validators.pattern(urlValidationExpression)]),
      tags: new FormControl([]),
    });
    this.bindExistingInstance = new FormGroup({
      serviceInstances: new FormControl('', [Validators.required]),
    });
    this.initUpdate(serviceInstanceId, endpointId);
    this.setupValidate();
  }
  public createEditServiceInstance: FormGroup;
  public bindExistingInstance: FormGroup;
  public separatorKeysCodes = [ENTER, COMMA, SPACE];
  public allServiceInstanceNames: string[];
  public subs: Subscription[] = [];
  public isUpdate: boolean;
  public tags: { label: string }[] = [];
  public valid = new BehaviorSubject(false);
  private subscriptions: Subscription[] = [];
  private tagsChanged = new BehaviorSubject(true);

  @Input()
  public cfGuid: string;
  @Input()
  public spaceGuid: string;
  @Input()
  public appId: string;
  @Input()
  public serviceInstanceId: string;

  @Input()
  public showModeSelection = false;

  public appNameChecking = new AppNameUniqueChecking();

  public serviceBindingForApplication$ = this.serviceInstancesForApplication();
  formModes = [
    {
      label: 'Create and Bind to a new User Provided Service Instance',
      key: CreateServiceFormMode.CreateServiceInstance
    },
    {
      label: 'Bind to an Existing User Provided Service Instance',
      key: CreateServiceFormMode.BindServiceInstance
    }
  ];
  formMode = CreateServiceFormMode.CreateServiceInstance;

  private originalFormValue;

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subscriptions);
  }

  private setupValidate() {
    const obs = obsCombineLatest([
      this.createEditServiceInstance.statusChanges.pipe(startWith('INVALID')),
      this.bindExistingInstance.statusChanges.pipe(startWith('INVALID')),
      this.tagsChanged
    ]).pipe(
      map(([createValid, bindValid]) =>
        this.formStatusToBool(this.formMode === CreateServiceFormMode.CreateServiceInstance ? createValid : bindValid)
      ),
      map(valid => this.validAndChanged(valid)),
    );
    this.subscriptions.push(this.tagsChanged.subscribe(() => {
      if (this.formMode === CreateServiceFormMode.CreateServiceInstance) {
        this.createEditServiceInstance.markAsTouched();
        this.createEditServiceInstance.markAsDirty();
        this.createEditServiceInstance.updateValueAndValidity();
      } else {
        this.bindExistingInstance.markAsTouched();
        this.bindExistingInstance.markAsDirty();
        this.bindExistingInstance.updateValueAndValidity();
      }
    }));
    this.subscriptions.push(obs.subscribe(valid => this.valid.next(valid)));
  }

  private validAndChanged(isValid = false): boolean {
    // Determine if the step is valid given
    // 1) the form element's validation state
    // 2) if process is update... also consider whether the form values have changed

    // Not valid, return immediately
    if (!isValid) {
      return false;
    }

    // Valid, but not update. Skip second part
    if (!this.isUpdate) {
      return true;
    }

    // Haven't yet initialised correctly, skip
    if (!this.originalFormValue) {
      return false;
    }

    // Compare original and new form values
    const newFormValue = this.getServiceData();
    if (JSON.stringify(this.originalFormValue) === JSON.stringify(newFormValue)) {
      // No change, return false
      return false;
    }
    return true;
  }

  private formStatusToBool(status: string): boolean {
    return status === 'VALID';
  }

  resetForms = (mode: CreateServiceFormMode) => {
    this.valid.next(false);
    this.createEditServiceInstance.reset();
    this.bindExistingInstance.reset();
    if (mode === CreateServiceFormMode.CreateServiceInstance) {
      this.tags = [];
    }
  }

  private serviceInstancesForApplication() {
    return this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      first(),
      switchMap(p => this.upsService.getUserProvidedServices(
        p.cfGuid,
        p.spaceGuid,
        [createEntityRelationKey(userProvidedServiceInstanceEntityType, serviceBindingEntityType)]
      )),
      map(upsis => upsis.map(upsi => {
        const alreadyBound = !!upsi.entity.service_bindings.find(binding => binding.entity.app_guid === this.appId);
        if (alreadyBound) {
          const updatedSvc: APIResource<IUserProvidedServiceInstance> = {
            entity: { ...upsi.entity },
            metadata: { ...upsi.metadata }
          };
          updatedSvc.entity.name += ' (Already bound)';
          updatedSvc.metadata.guid = null;
          return updatedSvc;
        }
        return upsi;
      })),
      startWith(null),
      publishReplay(1),
      refCount()
    );
  }
  private initUpdate(serviceInstanceId: string, endpointId: string) {
    if (this.isUpdate) {
      this.createEditServiceInstance.disable();
      this.upsService.getUserProvidedService(endpointId, serviceInstanceId).pipe(
        first(),
        map(entityInfo => entityInfo.entity)
      ).subscribe(entity => {
        this.createEditServiceInstance.enable();
        const serviceEntity = entity;
        this.createEditServiceInstance.setValue({
          name: serviceEntity.name,
          syslog_drain_url: serviceEntity.syslog_drain_url,
          credentials: JSON.stringify(serviceEntity.credentials),
          route_service_url: serviceEntity.route_service_url,
          tags: []
        });
        this.tags = this.tagsArrayToChips(serviceEntity.tags);
        this.originalFormValue = this.getServiceData();
      });
    }
  }

  public getUniqueRequest = (name: string) => {
    const params = new HttpParams()
      .set('q', 'name:' + name)
      .append('q', 'space_guid:' + this.spaceGuid);
    const headers = new HttpHeaders({
      'x-cap-cnsi-list': this.cfGuid,
      'x-cap-passthrough': 'true'
    });
    return new HttpRequest(
      'GET',
      `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/user_provided_service_instances`,
      {
        headers,
        params
      },
    );
  }

  public onNext = (): Observable<StepOnNextResult> => {
    return this.isUpdate ?
      this.onNextUpdate() :
      this.formMode === CreateServiceFormMode.CreateServiceInstance ? this.onNextCreate() : this.onNextBind();
  }

  private onNextCreate(): Observable<StepOnNextResult> {
    const data = this.getServiceData();
    const guid = `user-services-instance-${this.cfGuid}-${this.spaceGuid}-${data.name}`;
    return this.upsService.createUserProvidedService(
      this.cfGuid,
      guid,
      data as IUserProvidedServiceInstanceData,
    ).pipe(
      combineLatest(this.store.select(selectCreateServiceInstance)),
      switchMap(([request, state]) => {
        const success = !request.error;
        const redirect = !request.error;
        if (!!state.bindAppGuid && success) {
          const newGuid = request.response.result[0];
          return this.createApplicationServiceBinding(newGuid, state);
        }
        return observableOf({
          success,
          redirect,
          message: success ? '' : 'Failed to create User Provided Service Instance. Reason: "' + request.message + '"'
        });
      })
    );
  }

  private onNextBind(): Observable<StepOnNextResult> {
    return this.store.select(selectCreateServiceInstance).pipe(
      switchMap(data => this.createApplicationServiceBinding(this.bindExistingInstance.controls.serviceInstances.value, data))
    );
  }

  private createApplicationServiceBinding(serviceGuid: string, data: any): Observable<StepOnNextResult> {
    return this.modeService.createApplicationServiceBinding(serviceGuid, data.cfGuid, data.bindAppGuid, data.bindAppParams)
      .pipe(
        map(req => {
          if (!req.success) {
            return { success: false, message: `Failed to create service instance binding: ${req.message}` };
          } else {
            // Refetch env vars for app, since they have been changed by CF
            cfEntityCatalog.appEnvVar.api.getMultiple(data.bindAppGuid, data.cfGuid)
            return { success: true, redirect: true };
          }
        })
      );
  }

  private onNextUpdate(): Observable<StepOnNextResult> {
    const updateData = this.getServiceData();
    return this.upsService.updateUserProvidedService(
      this.cfGuid,
      this.serviceInstanceId,
      updateData
    ).pipe(
      map(er => ({
        success: !er.error,
        redirect: !er.error,
        message: `Failed to update service instance: ${er.message}`
      }))
    );
  }

  private getServiceData() {
    const data = {
      ...this.createEditServiceInstance.value,
      spaceGuid: this.spaceGuid || null
    };
    data.credentials = data.credentials ? JSON.parse(data.credentials) : {};

    data.tags = this.getTagsArray();
    return data;
  }


  private getTagsArray() {
    return this.tags && Array.isArray(this.tags) ? this.tags.map(tag => tag.label) : [];
  }

  private tagsArrayToChips(tagsArray: string[]) {
    return tagsArray && Array.isArray(tagsArray) ? tagsArray.map(label => ({ label })) : [];
  }


  public addTag(event: MatChipInputEvent): void {
    const input = event.input;

    const label = (event.value || '').trim();
    if (label) {
      this.tags.push({ label });
      this.tagsChanged.next(true);
    }

    if (input) {
      input.value = '';
    }
  }

  public removeTag(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
      this.tagsChanged.next(true);
    }
  }

}
