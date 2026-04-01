import { Component, OnDestroy, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe, StepOnNextFunction } from '@stratosui/core';
import { ActionState, APIResource, AppState } from '@stratosui/store';
import { ISpaceQuotaDefinition } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-edit-space-quota-step',
  templateUrl: './edit-space-quota-step.component.html',
  styleUrls: ['./edit-space-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SpaceQuotaDefinitionFormComponent
]
})
export class EditSpaceQuotaStepComponent implements OnDestroy {
  private store = inject<Store<AppState>>(Store);
  private activatedRoute = inject(ActivatedRoute);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);


  spaceQuotaSubscription!: Subscription;
  cfGuid: string;
  spaceQuotaGuid: string;
  allQuotas!: string[];
  spaceQuotaDefinition$!: Observable<APIResource<ISpaceQuotaDefinition>>;
  quota!: ISpaceQuotaDefinition;

  @ViewChild('form', { static: false })
  form!: SpaceQuotaDefinitionFormComponent;

  constructor() {

    this.cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.fetchQuotaDefinition();
  }

  fetchQuotaDefinition() {
    this.spaceQuotaDefinition$ = cfEntityCatalog.spaceQuota.store.getEntityService(
      this.spaceQuotaGuid,
      this.cfGuid,
      {}
    ).waitForEntity$.pipe(
      map(data => data.entity),
      tap((resource) => this.quota = resource.entity)
    );

    this.spaceQuotaSubscription = this.spaceQuotaDefinition$.subscribe();
  }

  validate = () => !!this.form && this.form.valid();

  submit: StepOnNextFunction = () =>
    cfEntityCatalog.spaceQuota.api.update<ActionState>(this.spaceQuotaGuid, this.cfGuid, this.form.formGroup.getRawValue()).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to update space quota: ${requestInfo.message}` : ''
      }))
    );


  ngOnDestroy() {
    safeUnsubscribe(this.spaceQuotaSubscription);
  }
}
