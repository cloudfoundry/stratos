import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, ChangeDetectionStrategy, effect, inject, runInInjectionContext, signal, input, untracked } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { AppErrorComponent, AppInputDirective, CustomFormFieldComponent, CustomOptionComponent, CustomSelectComponent, FocusDirective, SignalStepHandle } from '@stratosui/core';
import { CnsiOrgsSource } from '../../../../services/data-sources/cnsi-orgs-source';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import { EndpointDataService } from '../../../../services/endpoint-data/endpoint-data.service';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StOrgQuota } from '../../../../services/endpoint-data/stratos-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryOrganizationService } from '../../services/cloud-foundry-organization.service';
import { leadError } from '@stratosui/store';

const enum OrgStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended'
}

interface EditOrganizationForm {
  orgName: FormControl<string>;
  quotaDefinition: FormControl<string | null>;
}

@Component({
  selector: 'app-edit-organization-step',
  templateUrl: './edit-organization-step.component.html',
  host: { class: 'app-host-flex-1' },
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CloudFoundryOrganizationService,
    CloudFoundryUserProvidedServicesService
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppErrorComponent,
    AppInputDirective,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    FocusDirective
  ]
})
export class EditOrganizationStepComponent implements OnInit, OnDestroy {
  private cfOrgService = inject(CloudFoundryOrganizationService);
  private endpointDataRegistry = inject(EndpointDataRegistry);
  private http = inject(HttpClient);
  private quotaData = inject(QuotaDataService);
  private injector = inject(Injector);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  // The one host stepper binds where to go on success.
  readonly redirectUrl = input.required<string>();

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const newName = this.orgName.value;
      const newQuotaGuid = this.quotaDefinition.value;
      // Route the org PATCH through CnsiOrgsSource so the canonical
      // EndpointDataService._orgs row updates immediately and the
      // org.update cascade fires. The previous OrgWriteService.updateOrg
      // path was a thin http.patch that left the canonical cache stale.
      const eds = this.endpointDataRegistry.acquire(this.cfGuid);
      try {
        const source = new CnsiOrgsSource(this.cfGuid, this.http, eds);
        await source.update(this.orgGuid, {
          name: newName,
          suspended: !this.status(),
        });
        if (newQuotaGuid && newQuotaGuid !== this.originalQuotaGuid) {
          await firstValueFrom(this.quotaData.applyOrgQuotaToOrgs(this.cfGuid, newQuotaGuid, [this.orgGuid]));
          // org_quotas isn't cached on EDS but the org row's quotaGuid
          // is the source of truth for the displayed quota — mark stale
          // so the orgs list re-fetches.
          eds.applyCascade('org.update');
        }
        // Patch the OrgDataService cache so the auto-navigate to /summary
        // shows the new values without a hard reload — CnsiOrgsSource only
        // updates the EndpointData _orgs list, not the detail signal that
        // the summary view reads from.
        this.cfOrgService.orgDataService.patch({
          name: newName,
          ...(newQuotaGuid !== this.originalQuotaGuid ? { quotaGuid: newQuotaGuid ?? undefined } : {}),
        });
      } catch (err: unknown) {
        throw leadError('Failed to update organization', err);
      } finally {
        this.endpointDataRegistry.release(this.cfGuid);
      }
      await this.router.navigateByUrl(this.redirectUrl());
    },
  };

  private endpointData?: EndpointDataService;
  currentStatus!: string;
  originalName!: string;
  originalQuotaGuid: string | null = null;
  editOrgName: FormGroup<EditOrganizationForm>;
  /** True while the organization is active; set when the organization loads. */
  readonly status = signal(false);
  cfGuid: string;
  orgGuid: string;
  quotaSource!: SignalSource<StOrgQuota[]>;

  get orgName(): FormControl<string> { return this.editOrgName ? this.editOrgName.get('orgName') as FormControl<string> : new FormControl('', { nonNullable: true }); }

  get quotaDefinition(): FormControl<string | null> { return this.editOrgName ? this.editOrgName.get('quotaDefinition') as FormControl<string | null> : new FormControl(null); }

  constructor() {
    const cfOrgService = this.cfOrgService;

    this.orgGuid = cfOrgService.orgGuid;
    this.cfGuid = cfOrgService.cfGuid;
    this.editOrgName = this.fb.group<EditOrganizationForm>({
      orgName: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator()] }),
      quotaDefinition: new FormControl<string | null>(null),
    });
    // Fill the form once, from the first organization that loads.
    const prefill = effect(() => {
      const org = this.cfOrgService.orgDataService.org();
      if (!org) {
        return;
      }
      untracked(() => {
        this.originalName = org.name;
        this.originalQuotaGuid = org.quotaGuid || null;
        this.status.set(org.status === OrgStatus.ACTIVE);
        this.currentStatus = org.status;

        this.editOrgName.patchValue({
          orgName: org.name,
          quotaDefinition: org.quotaGuid || undefined,
        });
      });
      prefill.destroy();
    });
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } | null => {
      const nameValid = this.isNameUnique(formField.value);
      return !nameValid ? { nameTaken: { value: formField.value } } : null;
    };
  }

  ngOnInit() {
    this.validSignal.set(this.editOrgName.valid && this.editOrgName.dirty);
    this.formStatusSub = this.editOrgName.statusChanges.subscribe(
      () => this.validSignal.set(this.editOrgName.valid && this.editOrgName.dirty)
    );

    const endpointData = this.endpointData = this.endpointDataRegistry.acquire(this.cfGuid);
    endpointData.load().subscribe({ error: () => {} });
    endpointData.loadDetails().subscribe({ error: () => {} });

    this.quotaSource = this.quotaData.orgQuotas(this.cfGuid);
    // Trigger initial fetch so the SignalSource populates.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        // Reading value() registers the dependency so the signal stays live.
        this.quotaSource.value();
      });
    });
  }

  isNameUnique = (value: string | null = null): boolean => {
    if (this.endpointData && this.editOrgName) {
      const name = value ? value : this.orgName.value;
      return !this.endpointData.orgs().some(o => o.name !== this.originalName && o.name === name);
    }
    return true;
  }

  validate = () => this.validSignal();

  ngOnDestroy(): void {
    this.formStatusSub?.unsubscribe();
    this.endpointDataRegistry.release(this.cfGuid);
  }
}
