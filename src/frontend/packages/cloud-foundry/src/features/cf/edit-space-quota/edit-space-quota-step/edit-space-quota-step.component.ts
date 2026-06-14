import { ChangeDetectionStrategy, Component, Input, OnDestroy, Signal, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { SignalStepHandle } from '@stratosui/core';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StSpaceQuota } from '../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { formToSpaceQuotaUpdateBody } from '../../quota-definition-form/quota-form-mapping';

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
  private activatedRoute = inject(ActivatedRoute);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private router = inject(Router);
  private quotaData = inject(QuotaDataService);

  cfGuid: string;
  spaceQuotaGuid: string;
  readonly quota: Signal<StSpaceQuota | null>;
  private source: SignalSource<StSpaceQuota | null>;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

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
    // strict: @ViewChild setter populates _form after view init; the only
    // reader (submit) runs post-render when the form element exists.
    return this._form!;
  }

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const formValues = this.form.formGroup.getRawValue();
      const body = formToSpaceQuotaUpdateBody(formValues);
      try {
        await firstValueFrom(this.quotaData.updateSpaceQuota(this.cfGuid, this.spaceQuotaGuid, body));
      } catch (err: unknown) {
        throw new Error(`Failed to update space quota: ${err instanceof Error ? err.message : String(err)}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  constructor() {
    this.cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    this.spaceQuotaGuid = this.activatedRoute.snapshot.params.quotaId;

    this.source = this.quotaData.spaceQuota(this.cfGuid, this.spaceQuotaGuid);
    this.quota = computed(() => this.source.value());
  }

  ngOnDestroy() {
    this.formStatusSub?.unsubscribe();
  }
}
