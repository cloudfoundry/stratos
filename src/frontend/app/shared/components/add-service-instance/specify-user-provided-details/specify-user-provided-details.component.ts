import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { urlValidationExpression } from '../../../../core/utils.service';
import {
  CreateUserProvidedServiceInstance,
  GetUserProvidedService,
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance
} from '../../../../store/actions/user-provided-service.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, userProvidedServiceInstanceSchemaKey, serviceInstancesSchemaKey } from '../../../../store/helpers/entity-factory';
import { EntityMonitor } from '../../../monitors/entity-monitor';
import { isValidJsonValidator } from '../../schema-form/schema-form.component';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { EntityService } from './../../../../core/entity-service';
import { serviceSchemaKey } from './../../../../store/helpers/entity-factory';
import { APIResource } from './../../../../store/types/api.types';


const { proxyAPIVersion, cfAPIVersion } = environment;
@Component({
  selector: 'app-specify-user-provided-details',
  templateUrl: './specify-user-provided-details.component.html',
  styleUrls: ['./specify-user-provided-details.component.scss']
})
export class SpecifyUserProvidedDetailsComponent {
  public formGroup: FormGroup;
  public separatorKeysCodes = [ENTER, COMMA, SPACE];
  public allServiceInstanceNames: string[];
  public subs: Subscription[] = [];
  public isUpdate: boolean;

  @Input()
  public cfGuid: string;
  @Input()
  public spaceGuid: string;
  @Input()
  public serviceInstanceId: string;

  constructor(
    private store: Store<AppState>,
    route: ActivatedRoute,
  ) {
    const { endpointId, serviceInstanceId } = route.snapshot.params;
    this.isUpdate = endpointId && serviceInstanceId;
    this.formGroup = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      syslogDrainUrl: new FormControl('', [Validators.pattern(urlValidationExpression)]),
      credentials: new FormControl('', isValidJsonValidator()),
    });
    if (this.isUpdate) {
      this.formGroup.disable();
      const entityMonitor = new EntityMonitor(
        this.store,
        serviceInstanceId,
        userProvidedServiceInstanceSchemaKey,
        entityFactory(userProvidedServiceInstanceSchemaKey)
      );
      const entityService = new EntityService<APIResource>(
        this.store,
        entityMonitor,
        new GetUserProvidedService(serviceInstanceId, endpointId)
      );
      entityService.entityObs$
        .pipe(
          filter(entityInfo => entityInfo.entity && !entityInfo.entityRequestInfo.fetching),
          map(entityInfo => entityInfo.entity),
          first()
        )
        .subscribe(entity => {
          this.formGroup.enable();
          const serviceEntity = entity.entity;
          this.formGroup.setValue({
            name: entity.entity.name,
            syslogDrainUrl: entity.entity.syslog_drain_url,
            credentials: JSON.stringify(serviceEntity.credentials)
          });
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

  onNext = (): Observable<StepOnNextResult> => {
    return this.isUpdate ? this.onNextUpdate() : this.onNextCreate();
  }

  onNextCreate() {
    const data = {
      ...this.formGroup.value,
      spaceGuid: this.spaceGuid
    };
    data.credentials = data.credentials ? JSON.parse(data.credentials) : {};
    const guid = `user-services-instance-${this.cfGuid}-${this.spaceGuid}-${data.name}`;
    const action = new CreateUserProvidedServiceInstance(
      this.cfGuid,
      guid,
      data as IUserProvidedServiceInstanceData,
      serviceInstancesSchemaKey
    );
    this.store.dispatch(action);
    return new EntityMonitor(
      this.store,
      guid,
      userProvidedServiceInstanceSchemaKey,
      entityFactory(userProvidedServiceInstanceSchemaKey)
    ).entityRequest$.pipe(
      filter(er => er.creating),
      map(er => ({
        success: !er.error,
        redirect: !er.error
      }))
    );
  }

  onNextUpdate() {
    const updateData = this.formGroup.value;
    updateData.credentials = updateData.credentials ? JSON.parse(updateData.credentials) : {};
    const updateAction = new UpdateUserProvidedServiceInstance(
      this.cfGuid,
      this.serviceInstanceId,
      updateData,
      serviceSchemaKey
    );
    this.store.dispatch(updateAction);
    return new EntityMonitor(
      this.store,
      this.serviceInstanceId,
      userProvidedServiceInstanceSchemaKey,
      entityFactory(userProvidedServiceInstanceSchemaKey)
    ).entityRequest$.pipe(
      filter(
        er => er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance] &&
          er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].busy
      ),
      map(er => ({
        success: !er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].error,
        redirect: !er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].error
      }))
    );
  }
}
