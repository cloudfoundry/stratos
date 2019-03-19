import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';

import {
  IUserProvidedServiceInstanceData,
  UpdateUserProvidedServiceInstance,
} from '../../../../../../store/src/actions/user-provided-service.actions';
import { urlValidationExpression } from '../../../../core/utils.service';
import { environment } from '../../../../environments/environment';
import { AppNameUniqueChecking } from '../../../app-name-unique.directive/app-name-unique.directive';
import { isValidJsonValidator } from '../../../form-validators';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { StepOnNextResult } from '../../stepper/step/step.component';


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

  public appNameChecking = new AppNameUniqueChecking();

  constructor(
    route: ActivatedRoute,
    private upsService: CloudFoundryUserProvidedServicesService
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

  private onNextCreate() {
    const data = this.getServiceData();
    const guid = `user-services-instance-${this.cfGuid}-${this.spaceGuid}-${data.name}`;
    return this.upsService.createUserProvidedService(
      this.cfGuid,
      guid,
      data as IUserProvidedServiceInstanceData,
    ).pipe(
      map(er => ({
        success: !er.error,
        redirect: !er.error
      }))
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
