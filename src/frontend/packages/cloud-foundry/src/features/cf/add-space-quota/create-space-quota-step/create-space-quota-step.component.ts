import { AfterViewInit, Component, Input, OnDestroy, ViewChild, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { SignalStepHandle, StepOnNextFunction } from '@stratosui/core';
import { RequestInfoState, APIResource } from '@stratosui/store';
import { IQuotaDefinition } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';


@Component({
  selector: 'app-create-space-quota-step',
  templateUrl: './create-space-quota-step.component.html',
  styleUrls: ['./create-space-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SpaceQuotaDefinitionFormComponent
]
})
export class CreateSpaceQuotaStepComponent implements AfterViewInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);


  quotasSubscription!: Subscription;
  cfGuid: string;
  orgGuid: string;
  spaceQuotaDefinitions$!: Observable<APIResource<IQuotaDefinition>[]>;

  @ViewChild('form', { static: true })
  form!: SpaceQuotaDefinitionFormComponent;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: validity mirrored from the embedded SpaceQuotaDefinitionFormComponent
   * via a statusChanges subscription wired in ngAfterViewInit.
   */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const formValues = this.form.formGroup.getRawValue();
      const finalState = await firstValueFrom(
        cfEntityCatalog.spaceQuota.api.create<RequestInfoState>(formValues.name, this.cfGuid, {
          orgGuid: this.orgGuid,
          createQuota: formValues
        }).pipe(
          pairwise(),
          filter(([oldV, newV]) => oldV.creating && !newV.creating),
          map(([, newV]) => newV),
        )
      );
      if (finalState.error) {
        throw new Error(`Failed to create space quota: ${finalState.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = this.activatedRoute.snapshot.params.orgId;
  }

  ngAfterViewInit() {
    if (this.form?.formGroup) {
      this.validSignal.set(this.form.formGroup.valid);
      this.formStatusSub = this.form.formGroup.statusChanges.subscribe(
        () => this.validSignal.set(this.form.formGroup.valid)
      );
    }
  }

  ngOnDestroy() {
    this.formStatusSub?.unsubscribe();
  }
}
