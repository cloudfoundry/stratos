import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, ViewChild, inject, signal, input } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { SignalStepHandle } from '@stratosui/core';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { formToOrgQuotaWriteBody } from '../../quota-definition-form/quota-form-mapping';
import { leadError } from '@stratosui/store';

@Component({
  selector: 'app-create-quota-step',
  templateUrl: './create-quota-step.component.html',
  host: { class: 'flex-1' },
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
  private quotaData = inject(QuotaDataService);

  cfGuid: string;

  @ViewChild('form', { static: true })
  form!: QuotaDefinitionFormComponent;

  /** FWT-957: post-success navigation target supplied by parent. */
  readonly redirectUrl = input.required<string>();

  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const formValues = this.form.formGroup.getRawValue();
      const body = formToOrgQuotaWriteBody(formValues);
      try {
        await firstValueFrom(this.quotaData.createOrgQuota(this.cfGuid, body));
      } catch (err: unknown) {
        throw leadError('Failed to create quota', err);
      }
      await this.router.navigateByUrl(this.redirectUrl());
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
