import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../cloud-foundry/cf-types';
import {
  GetQuotaDefinition,
  UpdateQuotaDefinition,
} from '../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import { quotaDefinitionEntityType } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import { ActiveRouteCfOrgSpace } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../../store/src/app-state';
import { selectRequestInfo } from '../../../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../core/cf-api.types';
import { entityCatalogue } from '../../../../core/entity-catalogue/entity-catalogue.service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-edit-quota-step',
  templateUrl: './edit-quota-step.component.html',
  styleUrls: ['./edit-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class EditQuotaStepComponent implements OnDestroy {

  cfGuid: string;
  quotaGuid: string;
  quotaDefinition$: Observable<APIResource<IQuotaDefinition>>;
  quotaSubscription: Subscription;
  quota: IQuotaDefinition;

  @ViewChild('form')
  form: QuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private entityServiceFactory: EntityServiceFactory,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.quotaDefinition$ = this.entityServiceFactory.create<APIResource<IQuotaDefinition>>(
      this.quotaGuid,
      new GetQuotaDefinition(this.quotaGuid, this.cfGuid),
    ).waitForEntity$.pipe(
      first(),
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.quotaSubscription = this.quotaDefinition$.subscribe();
  }

  validate = () => this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;
    this.store.dispatch(new UpdateQuotaDefinition(this.quotaGuid, this.cfGuid, formValues));

    return this.store.select(
      selectRequestInfo(
        entityCatalogue.getEntityKey(CF_ENDPOINT_TYPE, quotaDefinitionEntityType),
        this.quotaGuid
      )
    ).pipe(
      filter(o => !!o && !o.updating[UpdateQuotaDefinition.UpdateExistingQuota].busy),
      map(o => o.updating[UpdateQuotaDefinition.UpdateExistingQuota]),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update quota: ${requestInfo.message}` : ''
      }))
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(this.quotaSubscription);
  }
}
