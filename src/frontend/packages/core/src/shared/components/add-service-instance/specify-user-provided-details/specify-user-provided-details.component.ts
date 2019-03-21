import { PaginationMonitorFactory } from './../../../monitors/pagination-monitor.factory';
import { CsiModeService } from './../csi-mode.service';
import { AppState } from './../../../../../../store/src/app-state';
import { Store } from '@ngrx/store';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, of as observableOf } from 'rxjs';
import { first, map, switchMap, combineLatest, filter, share, tap, startWith } from 'rxjs/operators';

import {
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
  GetAllUserProvidedServices,
} from '../../../../../../store/src/actions/user-provided-service.actions';
import { urlValidationExpression } from '../../../../core/utils.service';
import { environment } from '../../../../environments/environment';
import { AppNameUniqueChecking } from '../../../app-name-unique.directive/app-name-unique.directive';
import { isValidJsonValidator } from '../../../form-validators';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { GetAppEnvVarsAction } from '../../../../../../store/src/actions/app-metadata.actions';
import { selectCreateServiceInstance } from '../../../../../../store/src/selectors/create-service-instance.selectors';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../core/cf-api-svc.types';
import { entityFactory, serviceInstancesSchemaKey, userProvidedServiceInstanceSchemaKey } from '../../../../../../store/src/helpers/entity-factory';


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
  public tags: { label: string }[] = [];
  @Input()
  public cfGuid: string;
  @Input()
  public spaceGuid: string;
  @Input()
  public serviceInstanceId: string;

  @Input()
  public showModeSelection = false;

  public appNameChecking = new AppNameUniqueChecking();

  public serviceBindingForApplication$ = this.serviceInstancesFroApplication();

  constructor(
    route: ActivatedRoute,
    private upsService: CloudFoundryUserProvidedServicesService,
    private modeService: CsiModeService,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {

    const { endpointId, serviceInstanceId } =
      route && route.snapshot ? route.snapshot.params : { endpointId: null, serviceInstanceId: null };
    this.isUpdate = endpointId && serviceInstanceId;
    this.formGroup = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      syslog_drain_url: new FormControl('', [Validators.pattern(urlValidationExpression)]),
      credentials: new FormControl('', isValidJsonValidator()),
      route_service_url: new FormControl('', [Validators.pattern(urlValidationExpression)]),
      tags: new FormControl([]),
    });
    this.initUpdate(serviceInstanceId, endpointId);
  }

  private serviceInstancesFroApplication() {
    return this.store.select(selectCreateServiceInstance).pipe(
      tap(console.log),
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      first(),
      map(p => new GetAllUserProvidedServices(p.cfGuid, [], false, p.spaceGuid)),
      tap((action) => this.store.dispatch(action)),
      switchMap(action => {
        return this.paginationMonitorFactory.create(
          action.paginationKey,
          action.entity
        ).currentPage$;
      }),
      tap(console.log),
      startWith(null)
    );

  }
  private initUpdate(serviceInstanceId: string, endpointId: string) {
    if (this.isUpdate) {
      this.formGroup.disable();
      this.upsService.getUserProvidedService(endpointId, serviceInstanceId).pipe(
        first(),
        map(entityInfo => entityInfo.entity)
      ).subscribe(entity => {
        this.formGroup.enable();
        const serviceEntity = entity;
        this.formGroup.setValue({
          name: serviceEntity.name,
          syslog_drain_url: serviceEntity.syslog_drain_url,
          credentials: JSON.stringify(serviceEntity.credentials),
          route_service_url: serviceEntity.route_service_url,
          tags: []
        });
        this.tags = this.tagsArrayToChips(serviceEntity.tags);
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
    return this.isUpdate ? this.onNextUpdate() : this.onNextCreate();
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
        const guid = request.response.result[0];
        const success = !request.error;
        const redirect = !request.error;
        if (!!state.bindAppGuid && success) {
          return this.createApplicationServiceBinding(guid, state);
        }
        return observableOf({
          success,
          redirect
        });
      })
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
            this.store.dispatch(
              new GetAppEnvVarsAction(data.bindAppGuid, data.cfGuid)
            );
            return { success: true, redirect: true };
          }
        })
      );
  }

  private onNextUpdate() {
    const updateData = this.getServiceData();
    return this.upsService.updateUserProvidedService(
      this.cfGuid,
      this.serviceInstanceId,
      updateData
    ).pipe(
      map(er => ({
        success: !er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].error,
        redirect: !er.updating[UpdateUserProvidedServiceInstance.updateServiceInstance].error
      }))
    );
  }

  private getServiceData() {
    const data = {
      ...this.formGroup.value,
      spaceGuid: this.spaceGuid
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
    }

    if (input) {
      input.value = '';
    }
  }

  public removeTag(tag: any): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

}
