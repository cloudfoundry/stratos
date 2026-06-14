import { ChangeDetectionStrategy, Component, Input, OnDestroy, Signal, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { SignalStepHandle } from '@stratosui/core';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StOrgQuota } from '../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { formToOrgQuotaWriteBody } from '../../quota-definition-form/quota-form-mapping';

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
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private quotaData = inject(QuotaDataService);

  cfGuid: string;
  quotaGuid: string;
  readonly quota: Signal<StOrgQuota | null>;
  private source: SignalSource<StOrgQuota | null>;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

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
  get form(): QuotaDefinitionFormComponent | undefined {
    return this._form;
  }

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      if (!this.form) {
        throw new Error('Quota definition form is not available');
      }
      const formValues = this.form.formGroup.getRawValue();
      const body = formToOrgQuotaWriteBody(formValues);
      try {
        await firstValueFrom(this.quotaData.updateOrgQuota(this.cfGuid, this.quotaGuid, body));
      } catch (err: unknown) {
        throw new Error(`Failed to update quota: ${err instanceof Error ? err.message : String(err)}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.source = this.quotaData.orgQuota(this.cfGuid, this.quotaGuid);
    this.quota = computed(() => this.source.value());
  }

  ngOnDestroy() {
    this.formStatusSub?.unsubscribe();
  }
}
