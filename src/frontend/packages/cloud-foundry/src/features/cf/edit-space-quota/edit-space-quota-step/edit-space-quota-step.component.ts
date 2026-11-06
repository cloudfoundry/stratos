import { ChangeDetectionStrategy, Component, Signal, computed, inject, signal, input, untracked, viewChild, afterRenderEffect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SignalStepHandle } from '@stratosui/core';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StSpaceQuota } from '../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { formToSpaceQuotaUpdateBody } from '../../quota-definition-form/quota-form-mapping';
import { leadError } from '@stratosui/store';

@Component({
  selector: 'app-edit-space-quota-step',
  templateUrl: './edit-space-quota-step.component.html',
  host: { class: 'flex-1' },
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SpaceQuotaDefinitionFormComponent
]
})
export class EditSpaceQuotaStepComponent {
  private activatedRoute = inject(ActivatedRoute);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private router = inject(Router);
  private quotaData = inject(QuotaDataService);

  cfGuid: string;
  spaceQuotaGuid: string;
  readonly quota: Signal<StSpaceQuota | null>;
  private source: SignalSource<StSpaceQuota | null>;

  /** FWT-957: post-success navigation target supplied by parent. */
  // The one host stepper binds where to go on success.
  readonly redirectUrl = input.required<string>();

  private validSignal = signal(false);
  // The form sits inside an @if, so it exists only once the quota has loaded.
  readonly form = viewChild<SpaceQuotaDefinitionFormComponent>('form');

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
      // strict: submit runs post-render, when the form element exists.
      const formValues = this.form()!.formGroup.getRawValue();
      const body = formToSpaceQuotaUpdateBody(formValues);
      try {
        await firstValueFrom(this.quotaData.updateSpaceQuota(this.cfGuid, this.spaceQuotaGuid, body));
      } catch (err: unknown) {
        throw leadError('Failed to update space quota', err);
      }
      await this.router.navigateByUrl(this.redirectUrl());
    },
  };

  constructor() {
    this.cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.source = this.quotaData.spaceQuota(this.cfGuid, this.spaceQuotaGuid);
    this.quota = computed(() => this.source.value());
  }
}
