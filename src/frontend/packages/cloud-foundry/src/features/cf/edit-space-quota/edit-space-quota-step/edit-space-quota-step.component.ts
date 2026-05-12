import { Component, Input, OnDestroy, ViewChild, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@stratosui/store';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe, SignalStepHandle, StepOnNextFunction } from '@stratosui/core';
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
  private router = inject(Router);


  spaceQuotaSubscription!: Subscription;
  cfGuid: string;
  spaceQuotaGuid: string;
  allQuotas!: string[];
  spaceQuotaDefinition$!: Observable<APIResource<ISpaceQuotaDefinition>>;
  quota!: ISpaceQuotaDefinition;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: validity mirrored from the embedded SpaceQuotaDefinitionFormComponent.
   * The form is conditionally rendered (@if quota), so we wire the
   * subscription via the ViewChild setter once the child appears.
   */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;
  private _form?: SpaceQuotaDefinitionFormComponent;

  @ViewChild('form', { static: false })
  set form(value: SpaceQuotaDefinitionFormComponent) {
    this._form = value;
    this.formStatusSub?.unsubscribe();
    if (value?.formGroup) {
      this.validSignal.set(value.formGroup.valid && value.formGroup.dirty);
      this.formStatusSub = value.formGroup.statusChanges.subscribe(
        () => this.validSignal.set(value.formGroup.valid && value.formGroup.dirty)
      );
    }
  }
  get form(): SpaceQuotaDefinitionFormComponent {
    return this._form;
  }

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const finalState = await firstValueFrom(
        cfEntityCatalog.spaceQuota.api.update<ActionState>(this.spaceQuotaGuid, this.cfGuid, this.form.formGroup.getRawValue()).pipe(
          pairwise(),
          filter(([oldV, newV]) => oldV.busy && !newV.busy),
          map(([, newV]) => newV),
        )
      );
      if (finalState.error) {
        throw new Error(`Failed to update space quota: ${finalState.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

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

  ngOnDestroy() {
    safeUnsubscribe(this.spaceQuotaSubscription);
    this.formStatusSub?.unsubscribe();
  }
}
