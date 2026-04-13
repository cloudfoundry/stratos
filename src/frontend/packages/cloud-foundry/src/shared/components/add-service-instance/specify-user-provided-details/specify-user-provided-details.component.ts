import { CommonModule } from '@angular/common';
import { AppInputDirective, CustomFormFieldComponent, MatLabelComponent } from '@stratosui/core';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Component, Input, OnDestroy, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, Validators, FormControl, FormGroup } from '@angular/forms';
import { CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { ActivatedRoute } from '@angular/router';

// Form interfaces
interface CreateEditServiceInstanceForm {
  name: FormControl<string>;
  syslog_drain_url: FormControl<string>;
  credentials: FormControl<string>;
  route_service_url: FormControl<string>;
  tags: FormControl<any[]>;
}

interface BindExistingInstanceForm {
  serviceInstances: FormControl<string>;
}

import { StatefulIconComponent, safeUnsubscribe, urlValidationExpression, environment, StepOnNextResult, isValidJsonValidator } from '@stratosui/core';
import { AppNameUniqueDirective } from '../../../directives/app-name-unique.directive/app-name-unique.directive';
import { Store } from '@ngrx/store';
import { combineLatest as obsCombineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { take, combineLatest, filter, map, publishReplay, refCount, startWith, switchMap } from 'rxjs/operators';
import { APIResource } from '@stratosui/store';

import { IUserProvidedServiceInstanceData } from '../../../../actions/user-provided-service.actions';
import { CFAppState } from '../../../../cf-app-state';
import {
  serviceBindingEntityType,
  userProvidedServiceInstanceEntityType } from '../../../../cf-entity-types';
import { createEntityRelationKey } from '../../../../entity-relations/entity-relations.types';
import {
  selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { IUserProvidedServiceInstance } from '../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { AppNameUniqueChecking } from '../../../directives/app-name-unique.directive/app-name-unique.directive';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { AppServiceBindingDataSource } from '../../list/list-types/app-sevice-bindings/app-service-binding-data-source';
import { CreateServiceFormMode, CsiModeService } from './../csi-mode.service';

const { proxyAPIVersion, cfAPIVersion } = environment;
@Component({
  selector: 'app-specify-user-provided-details',
  templateUrl: './specify-user-provided-details.component.html',
  styleUrls: ['./specify-user-provided-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    MatLabelComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    AppNameUniqueDirective,
    StatefulIconComponent
  ]
})
export class SpecifyUserProvidedDetailsComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private upsService = inject(CloudFoundryUserProvidedServicesService);
  modeService = inject(CsiModeService);
  private store = inject<Store<CFAppState>>(Store);


  constructor() {
    const route = this.route;

    const { endpointId, serviceInstanceId } =
      route && route.snapshot ? route.snapshot.params : { endpointId: null, serviceInstanceId: null };
    this.isUpdate = endpointId && serviceInstanceId;

    this.createEditServiceInstance = new FormGroup<CreateEditServiceInstanceForm>({
      name: new FormControl('', { validators: [Validators.required, Validators.maxLength(50)], nonNullable: true }),
      syslog_drain_url: new FormControl('', { validators: [Validators.pattern(urlValidationExpression)], nonNullable: true }),
      credentials: new FormControl('', { validators: isValidJsonValidator(), nonNullable: true }),
      route_service_url: new FormControl('', { validators: [Validators.pattern(urlValidationExpression)], nonNullable: true }),
      tags: new FormControl<any[]>([], { nonNullable: true }) });
    this.bindExistingInstance = new FormGroup<BindExistingInstanceForm>({
      serviceInstances: new FormControl('', { validators: [Validators.required], nonNullable: true }) });
    this.initUpdate(serviceInstanceId, endpointId);
    this.setupValidate();
  }
  public createEditServiceInstance: FormGroup<CreateEditServiceInstanceForm>;
  public bindExistingInstance: FormGroup<BindExistingInstanceForm>;
  public allServiceInstanceNames!: string[];
  public subs: Subscription[] = [];
  public isUpdate: boolean;
  public tags: { label: string }[] = [];
  public validate = signal(false);
  private subscriptions: Subscription[] = [];

  @Input()
  public cfGuid!: string;
  @Input()
  public spaceGuid!: string;
  @Input()
  public appId!: string;
  @Input()
  public serviceInstanceId!: string;

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

  private originalFormValue: IUserProvidedServiceInstanceData | null = null;

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subscriptions);
  }

  private setupValidate() {
    const obs = obsCombineLatest([
      this.createEditServiceInstance.statusChanges.pipe(startWith('INVALID')),
      this.bindExistingInstance.statusChanges.pipe(startWith('INVALID'))
    ]).pipe(
      map(([createValid, bindValid]) =>
        this.formStatusToBool(this.formMode === CreateServiceFormMode.CreateServiceInstance ? createValid : bindValid)
      ),
      map(valid => this.validAndChanged(valid)),
    );

    // Subscribe to form status changes and update validate signal
    // Note: We don't call updateValueAndValidity here to avoid infinite loops
    this.subscriptions.push(obs.subscribe(valid => {
      this.validate.set(valid);
    }));
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
    this.validate.set(false);
    this.createEditServiceInstance.reset();
    this.bindExistingInstance.reset();
    if (mode === CreateServiceFormMode.CreateServiceInstance) {
      this.tags = [];
    }
  };

  private serviceInstancesForApplication() {
    return this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      take(1),
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
        take(1),
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
  };

  public onNext = (): Observable<StepOnNextResult> => {
    return this.isUpdate ?
      this.onNextUpdate() :
      this.formMode === CreateServiceFormMode.CreateServiceInstance ? this.onNextCreate() : this.onNextBind();
  };

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
            cfEntityCatalog.appEnvVar.api.getMultiple(data.bindAppGuid, data.cfGuid);
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
      map(er => {
        if (!er.error) {
          // Update the application binding list
          const appId = this.appId || this.route.snapshot.queryParamMap.get('appId');
          if (appId) {
            this.store.dispatch(AppServiceBindingDataSource.createGetAllServiceBindings(appId, this.cfGuid));
          }
          return {
            success: true,
            redirect: true };
        }
        return {
          success: false,
          redirect: false,
          message: `Failed to update service instance: ${er.message}`
        };
      })
    );
  }

  private getServiceData(): IUserProvidedServiceInstanceData {
    const formValue = this.createEditServiceInstance.value;
    return {
      spaceGuid: this.spaceGuid,
      name: formValue.name!,
      route_service_url: formValue.route_service_url || undefined,
      syslog_drain_url: formValue.syslog_drain_url || undefined,
      tags: this.getTagsArray(),
      credentials: formValue.credentials ? JSON.parse(formValue.credentials) : undefined
    };
  }


  private getTagsArray() {
    return this.tags && Array.isArray(this.tags) ? this.tags.map(tag => tag.label) : [];
  }

  private tagsArrayToChips(tagsArray: string[]) {
    return tagsArray && Array.isArray(tagsArray) ? tagsArray.map(label => ({ label })) : [];
  }


  public addTagFromInput(event: KeyboardEvent): void {
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const label = (input.value || '').trim();

    if (label) {
      this.tags.push({ label });
      this.updateTagsFormControl();
      input.value = '';
    }
  }

  public removeTag(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
      this.updateTagsFormControl();
    }
  }

  private updateTagsFormControl(): void {
    const tagsArray = this.tags.map(t => t.label);
    this.createEditServiceInstance.controls.tags.setValue(tagsArray);
    this.createEditServiceInstance.controls.tags.markAsTouched();
    // Mark the form as dirty to trigger change detection
    this.createEditServiceInstance.markAsDirty();
  }

}
