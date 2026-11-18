import { ChangeDetectionStrategy, Component, Signal, computed, inject, signal, input, untracked, viewChild, afterRenderEffect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SignalStepHandle } from '@stratosui/core';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StOrgQuota } from '../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { formToOrgQuotaWriteBody } from '../../quota-definition-form/quota-form-mapping';
import { leadError } from '@stratosui/store';

@Component({
  selector: 'app-edit-quota-step',
  templateUrl: './edit-quota-step.component.html',
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
export class EditQuotaStepComponent {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private quotaData = inject(QuotaDataService);

  cfGuid: string;
  quotaGuid: string;
  readonly quota: Signal<StOrgQuota | null>;
  private source: SignalSource<StOrgQuota | null>;

  /** FWT-957: post-success navigation target supplied by parent. */
  // The one host stepper binds where to go on success.
  readonly redirectUrl = input.required<string>();

  private validSignal = signal(false);
  // The form sits inside an @if, so it exists only once the quota has loaded.
  readonly form = viewChild<QuotaDefinitionFormComponent>('form');

  // The bridges run after render: a step's child creates its streams in
  // its own init hooks, which run after this component's effects.
  private readonly formStatus = afterRenderEffect(onCleanup => {
    const form = this.form();
    untracked(() => {
      if (!form?.formGroup) {
        return;
      }
      this.validSignal.set(form.formGroup.valid && form.formGroup.dirty);
      const sub = form.formGroup.statusChanges.subscribe(
        () => this.validSignal.set(form.formGroup.valid && form.formGroup.dirty)
      );
      onCleanup(() => sub.unsubscribe());
    });
  });

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const form = this.form();
      if (!form) {
        throw new Error('Quota definition form is not available');
      }
      const formValues = form.formGroup.getRawValue();
      const body = formToOrgQuotaWriteBody(formValues);
      try {
        await firstValueFrom(this.quotaData.updateOrgQuota(this.cfGuid, this.quotaGuid, body));
      } catch (err: unknown) {
        throw leadError('Failed to update quota', err);
      }
      await this.router.navigateByUrl(this.redirectUrl());
    },
  };

  constructor() {
    const activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.quotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.source = this.quotaData.orgQuota(this.cfGuid, this.quotaGuid);
    this.quota = computed(() => this.source.value());
  }
}
