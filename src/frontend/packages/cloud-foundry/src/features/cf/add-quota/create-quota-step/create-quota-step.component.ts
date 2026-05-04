import { AfterViewInit, Component, Input, OnDestroy, ViewChild, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { filter, map, pairwise } from 'rxjs/operators';

import { SignalStepHandle, StepOnNextFunction } from '@stratosui/core';
import { RequestInfoState } from '@stratosui/store';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';


@Component({
  selector: 'app-create-quota-step',
  templateUrl: './create-quota-step.component.html',
  styleUrls: ['./create-quota-step.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QuotaDefinitionFormComponent
  ]
})
export class CreateQuotaStepComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);

  quotasSubscription!: Subscription;
  cfGuid: string;
  quotaForm!: FormGroup;

  @ViewChild('form', { static: true })
  form!: QuotaDefinitionFormComponent;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: validity is mirrored from the embedded QuotaDefinitionFormComponent
   * via a statusChanges subscription wired in ngAfterViewInit. Plain signal
   * read so the SignalStepHandle.valid contract holds.
   */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const formValues = this.form.formGroup.getRawValue();
      const finalState = await firstValueFrom(
        cfEntityCatalog.quotaDefinition.api.create<RequestInfoState>(formValues.name, this.cfGuid, formValues).pipe(
          pairwise(),
          filter(([oldV, newV]) => oldV.creating && !newV.creating),
          map(([, newV]) => newV),
        )
      );
      if (finalState.error) {
        throw new Error(`Failed to create quota: ${finalState.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
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
