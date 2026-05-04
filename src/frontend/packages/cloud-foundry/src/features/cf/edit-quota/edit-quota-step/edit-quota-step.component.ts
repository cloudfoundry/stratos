
import { Component, Input, OnDestroy, ViewChild, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { take, filter, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe, SignalStepHandle, StepOnNextFunction } from '@stratosui/core';
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
  private router = inject(Router);


  cfGuid: string;
  quotaGuid: string;
  quotaDefinition$!: Observable<APIResource<IOrgQuotaDefinition>>;
  quotaSubscription!: Subscription;
  quota!: IOrgQuotaDefinition;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: validity mirrored from the embedded QuotaDefinitionFormComponent.
   * The form is conditionally rendered (@if quota), so we wire the
   * subscription via the ViewChild setter once the child appears.
   */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;
  private _form?: QuotaDefinitionFormComponent;

  @ViewChild('form', { static: false })
  set form(value: QuotaDefinitionFormComponent) {
    this._form = value;
    this.formStatusSub?.unsubscribe();
    if (value?.formGroup) {
      this.validSignal.set(value.formGroup.valid && value.formGroup.dirty);
      this.formStatusSub = value.formGroup.statusChanges.subscribe(
        () => this.validSignal.set(value.formGroup.valid && value.formGroup.dirty)
      );
    }
  }
  get form(): QuotaDefinitionFormComponent {
    return this._form;
  }

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const finalState = await firstValueFrom(
        cfEntityCatalog.quotaDefinition.api.update<ActionState>(this.quotaGuid, this.cfGuid, this.form.formGroup.getRawValue()).pipe(
          pairwise(),
          filter(([oldV, newV]) => oldV.busy && !newV.busy),
          map(([, newV]) => newV),
        )
      );
      if (finalState.error) {
        throw new Error(`Failed to update quota: ${finalState.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

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

  ngOnDestroy() {
    safeUnsubscribe(this.quotaSubscription);
    this.formStatusSub?.unsubscribe();
  }
}
