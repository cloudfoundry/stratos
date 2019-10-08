import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import {
  GetSpaceQuotaDefinition,
  UpdateSpaceQuotaDefinition,
} from '../../../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory, spaceQuotaSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-edit-space-quota-step',
  templateUrl: './edit-space-quota-step.component.html',
  styleUrls: ['./edit-space-quota-step.component.scss']
})
export class EditSpaceQuotaStepComponent implements OnDestroy {

  spaceQuotaSubscription: Subscription;
  cfGuid: string;
  spaceQuotaGuid: string;
  allQuotas: string[];
  spaceQuotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  quota: IQuotaDefinition;

  @ViewChild('form')
  form: SpaceQuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.spaceQuotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
      spaceQuotaSchemaKey,
      entityFactory(spaceQuotaSchemaKey),
      this.spaceQuotaGuid,
      new GetSpaceQuotaDefinition(this.spaceQuotaGuid, this.cfGuid),
    ).waitForEntity$.pipe(
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.spaceQuotaSubscription = this.spaceQuotaDefinition$.subscribe();
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;
    this.store.dispatch(new UpdateSpaceQuotaDefinition(this.spaceQuotaGuid, this.cfGuid, formValues));

    return this.store.select(selectRequestInfo(spaceQuotaSchemaKey, this.spaceQuotaGuid)).pipe(
      filter(o => !!o && !o.updating[UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota].busy),
      map(o => o.updating[UpdateSpaceQuotaDefinition.UpdateExistingSpaceQuota]),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update space quota: ${requestInfo.message}` : ''
      }))
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(this.spaceQuotaSubscription);
  }
}
