import { Component, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../../../../../cloud-foundry/src/cf-entity-catalog';
import { AppState } from '../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { ISpaceQuotaDefinition } from '../../../../core/cf-api.types';
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
  spaceQuotaDefinition$: Observable<APIResource<ISpaceQuotaDefinition>>;
  quota: ISpaceQuotaDefinition;

  @ViewChild('form', { static: false })
  form: SpaceQuotaDefinitionFormComponent;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
  ) {
    this.cfGuid = this.activatedRoute.snapshot.params.endpointId;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.spaceQuotaDefinition$ = cfEntityCatalog.spaceQuota.store.getEntityService(this.spaceQuotaGuid, this.cfGuid).waitForEntity$.pipe(
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.spaceQuotaSubscription = this.spaceQuotaDefinition$.subscribe();
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () => {
    const formValues = this.form.formGroup.value;

    const action = cfEntityCatalog.spaceQuota.actions.update(this.spaceQuotaGuid, this.cfGuid, formValues);
    this.store.dispatch(action);
    return cfEntityCatalog.quotaDefinition.store.getEntityMonitor(this.spaceQuotaGuid)
      .getUpdatingSection(action.updatingKey)
      .pipe(
        pairwise(),
        filter(([oldV, newV]) => oldV.busy && !newV.busy),
        map(([, newV]) => newV),
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
