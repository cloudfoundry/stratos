
import { Component, type OnDestroy, ViewChild , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import type { Observable, Subscription } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe, type StepOnNextFunction } from '@stratosui/core';
import type { AppState, ActionState, APIResource } from '@stratosui/store';
import type { IOrgQuotaDefinition } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-edit-quota-step',
  templateUrl: './edit-quota-step.component.html',
  styleUrls: ['./edit-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QuotaDefinitionFormComponent
]
})
export class EditQuotaStepComponent implements OnDestroy {

  cfGuid: string;
  quotaGuid: string;
  quotaDefinition$!: Observable<APIResource<IOrgQuotaDefinition>>;
  quotaSubscription!: Subscription;
  quota!: IOrgQuotaDefinition;

  @ViewChild('form', { static: false })
  form!: QuotaDefinitionFormComponent;

  constructor(
    private store: Store,
    private activatedRoute: ActivatedRoute,
    activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.quotaDefinition$ = cfEntityCatalog.quotaDefinition.store.getEntityService(this.quotaGuid, this.cfGuid, {}).waitForEntity$.pipe(
      first(),
      map(data => data.entity),
      tap((resource) => {
        this.quota = resource.entity;
      })
    );

    this.quotaSubscription = this.quotaDefinition$.subscribe();
  }

  validate = () => this.form?.valid();

  submit: StepOnNextFunction = () =>
    cfEntityCatalog.quotaDefinition.api.update<ActionState>(this.quotaGuid, this.cfGuid, this.form.formGroup.getRawValue()).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update quota: ${requestInfo.message}` : ''
      }))
    );


  ngOnDestroy() {
    safeUnsubscribe(this.quotaSubscription);
  }
}
