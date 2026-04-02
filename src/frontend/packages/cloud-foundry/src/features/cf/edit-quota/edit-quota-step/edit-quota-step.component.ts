
import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take, filter, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe, StepOnNextFunction } from '@stratosui/core';
import { AppState, ActionState, APIResource } from '@stratosui/store';
import { IOrgQuotaDefinition } from '../../../../cf-api.types';
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
  private store = inject<Store<AppState>>(Store);
  private activatedRoute = inject(ActivatedRoute);


  cfGuid: string;
  quotaGuid: string;
  quotaDefinition$!: Observable<APIResource<IOrgQuotaDefinition>>;
  quotaSubscription!: Subscription;
  quota!: IOrgQuotaDefinition;

  @ViewChild('form', { static: false })
  form!: QuotaDefinitionFormComponent;

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.quotaDefinition$ = cfEntityCatalog.quotaDefinition.store.getEntityService(this.quotaGuid, this.cfGuid, {}).waitForEntity$.pipe(
      take(1),
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.quotaSubscription = this.quotaDefinition$.subscribe();
  }

  validate = () => this.form && this.form.valid();

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
