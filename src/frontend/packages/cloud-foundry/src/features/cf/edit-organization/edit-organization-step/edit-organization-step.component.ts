import { CommonModule } from '@angular/common';
import { Component, Injector, Input, OnDestroy, OnInit, ChangeDetectionStrategy, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

import { AppInputDirective, CustomFormFieldComponent, CustomOptionComponent, CustomSelectComponent, FocusDirective, SignalStepHandle, safeUnsubscribe } from '@stratosui/core';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import { OrgWriteService } from '../../../../services/endpoint-data/org-write.service';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StOrgQuota } from '../../../../services/endpoint-data/stratos-types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryOrganizationService } from '../../services/cloud-foundry-organization.service';

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
  styleUrls: ['./edit-organization-step.component.scss'],
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
  private orgWriteService = inject(OrgWriteService);
  private quotaData = inject(QuotaDataService);
  private injector = inject(Injector);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const newName = this.orgName.value;
      const newQuotaGuid = this.quotaDefinition.value;
      try {
        await firstValueFrom(this.orgWriteService.updateOrg(this.cfGuid, this.orgGuid, {
          name: newName,
          suspended: !this.status,
        }));
        if (newQuotaGuid && newQuotaGuid !== this.originalQuotaGuid) {
          await firstValueFrom(this.quotaData.applyOrgQuotaToOrgs(this.cfGuid, newQuotaGuid, [this.orgGuid]));
        }
      } catch (err: unknown) {
        throw new Error(`Failed to update organization: ${err instanceof Error ? err.message : String(err)}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  fetchOrgsSub!: Subscription;
  allOrgsInEndpoint: string[] = [];
  allOrgsInEndpoint$!: Observable<string[]>;
  orgSubscription!: Subscription;
  currentStatus!: string;
  originalName!: string;
  originalQuotaGuid: string | null = null;
  org$: Observable<{ name: string; status: string; quota_definition_guid: string | undefined }>;
  editOrgName: FormGroup<EditOrganizationForm>;
  status: boolean;
  cfGuid: string;
  orgGuid: string;
  quotaSource!: SignalSource<StOrgQuota[]>;

  get orgName(): FormControl<string> { return this.editOrgName ? this.editOrgName.get('orgName') as FormControl<string> : new FormControl('', { nonNullable: true }); }

  get quotaDefinition(): FormControl<string | null> { return this.editOrgName ? this.editOrgName.get('quotaDefinition') as FormControl<string | null> : new FormControl(null); }

  constructor() {
    const cfOrgService = this.cfOrgService;

    this.orgGuid = cfOrgService.orgGuid;
    this.cfGuid = cfOrgService.cfGuid;
    this.status = false;
    this.editOrgName = this.fb.group<EditOrganizationForm>({
      orgName: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator()] }),
      quotaDefinition: new FormControl<string | null>(null),
    });
    this.org$ = toObservable(this.cfOrgService.orgDataService.org, { injector: this.injector }).pipe(
      filter((o): o is NonNullable<typeof o> => !!o),
      map(o => ({
        name: o.name,
        status: o.status,
        quota_definition_guid: o.quotaGuid || undefined,
      })),
      take(1),
      tap(n => {
        this.originalName = n.name;
        this.originalQuotaGuid = n.quota_definition_guid ?? null;
        this.status = n.status === OrgStatus.ACTIVE ? true : false;
        this.currentStatus = n.status;

        this.editOrgName.patchValue({
          orgName: n.name,
          quotaDefinition: n.quota_definition_guid,
        });
      })
    );

    this.orgSubscription = this.org$.subscribe();
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameValid = this.isNameUnique(formField.value);
      return !nameValid ? { nameTaken: { value: formField.value } } : null;
    };
  }

  ngOnInit() {
    this.validSignal.set(this.editOrgName.valid && this.editOrgName.dirty);
    this.formStatusSub = this.editOrgName.statusChanges.subscribe(
      () => this.validSignal.set(this.editOrgName.valid && this.editOrgName.dirty)
    );

    const endpointData = this.endpointDataRegistry.acquire(this.cfGuid);
    endpointData.load().subscribe({ error: () => {} });
    endpointData.loadDetails().subscribe({ error: () => {} });
    this.allOrgsInEndpoint$ = toObservable(endpointData.orgs, { injector: this.injector }).pipe(
      filter(orgs => !!orgs && orgs.length > 0),
      map(orgs => orgs.map(o => o.name)),
      tap(names => this.allOrgsInEndpoint = names),
    );
    this.fetchOrgsSub = this.allOrgsInEndpoint$.subscribe();

    this.quotaSource = this.quotaData.orgQuotas(this.cfGuid);
    // Trigger initial fetch so the SignalSource populates.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        // Reading value() registers the dependency so the signal stays live.
        this.quotaSource.value();
      });
    });
  }

  isNameUnique = (value: string = null): boolean => {
    if (this.allOrgsInEndpoint && this.editOrgName) {
      return this.allOrgsInEndpoint
        .filter((o: string) => o !== this.originalName)
        .indexOf(value ? value : this.orgName.value) === -1;
    }
    return true;
  }

  validate = () => this.validSignal();

  ngOnDestroy(): void {
    safeUnsubscribe(this.fetchOrgsSub, this.orgSubscription);
    this.formStatusSub?.unsubscribe();
    this.endpointDataRegistry.release(this.cfGuid);
  }
}
