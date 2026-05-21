import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { SignalStepHandle } from '@stratosui/core';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { formToSpaceQuotaCreateBody } from '../../quota-definition-form/quota-form-mapping';

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
  private quotaData = inject(QuotaDataService);

  cfGuid: string;
  orgGuid: string;

  @ViewChild('form', { static: true })
  form!: SpaceQuotaDefinitionFormComponent;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const formValues = this.form.formGroup.getRawValue();
      const body = formToSpaceQuotaCreateBody(formValues, this.orgGuid);
      try {
        await firstValueFrom(this.quotaData.createSpaceQuota(this.cfGuid, body));
      } catch (err: unknown) {
        throw new Error(`Failed to create space quota: ${err instanceof Error ? err.message : String(err)}`);
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
