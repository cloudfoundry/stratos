import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { safeUnsubscribe, urlValidationExpression } from '../../../../core/utils.service';
import { AppState } from '../../../../store/app-state';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { isValidJsonValidator } from '../../schema-form/schema-form.component';
import { StepOnNextResult } from '../../stepper/step/step.component';
import {
  CreateUserProvidedServiceInstance,
  IUserProvidedServiceInstanceData
} from '../../../../store/actions/user-provided-service.actions';
import { EntityMonitor } from '../../../monitors/entity-monitor';
import {
  entityFactory,
  userProvidedServiceInstanceSchemaKey
} from '../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-specify-user-provided-details',
  templateUrl: './specify-user-provided-details.component.html',
  styleUrls: ['./specify-user-provided-details.component.scss']
})
export class SpecifyUserProvidedDetailsComponent implements OnInit, OnDestroy {
  public formGroup: FormGroup;
  public tags: { label: string }[] = [];
  public separatorKeysCodes = [ENTER, COMMA, SPACE];
  public allServiceInstanceNames: string[];
  public subs: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
    private userProvidedServicesService: CloudFoundryUserProvidedServicesService
  ) {
    this.formGroup = new FormGroup({
      name: new FormControl('', [Validators.required, this.nameTakenValidator(), Validators.maxLength(50)]),
      url: new FormControl('', [Validators.pattern(urlValidationExpression)]),
      syslogDrainUrl: new FormControl(''),
      tags: new FormControl(''),
      credentials: new FormControl('', isValidJsonValidator()),
    });
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    safeUnsubscribe(...this.subs);
  }

  onEnter = () => {
    this.setupFormValidatorData();
  }

  onNext = (): Observable<StepOnNextResult> => {
    const data = this.formGroup.value as IUserProvidedServiceInstanceData;
    const action = new CreateUserProvidedServiceInstance('cfGuid', 'dasd', data);
    this.store.dispatch(action);
    return new EntityMonitor(
      this.store, 'a', 'a', entityFactory(userProvidedServiceInstanceSchemaKey)
    ).entityRequest$.pipe(
      filter(er => er.creating),
      map(er => ({
        success: !er.error
      }))
    );
  }

  private setupFormValidatorData(): Subscription {
    return this.store.select(selectCreateServiceInstance).pipe(
      // TODO: RC Edit case
      switchMap(csi => this.userProvidedServicesService.getUserProvidedServices(csi.cfGuid, csi.spaceGuid)),
      map(ups => ups.map(up => up.entity.name)),
      first()
    ).subscribe();
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.checkName(formField.value) ? { 'nameTaken': { value: formField.value } } : null;
  }

  checkName = (value: string = null) => {
    if (this.allServiceInstanceNames) {
      // const specifiedName = value || this.formGroup.controls.name.value;
      // if (this.modeService.isEditServiceInstanceMode() && specifiedName === this.serviceInstanceName) {
      //   return true;
      // }
      return this.allServiceInstanceNames.indexOf(value || this.formGroup.controls.name.value) === -1;
    }
    return true;
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
}
