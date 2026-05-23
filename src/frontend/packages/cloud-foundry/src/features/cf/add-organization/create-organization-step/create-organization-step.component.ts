import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Injector, Input, OnDestroy, OnInit, ChangeDetectionStrategy, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { AppInputDirective, CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, FocusDirective, SignalStepHandle, TailwindSnackBarService } from '@stratosui/core';
import { CnsiOrgsSource } from '../../../../services/data-sources/cnsi-orgs-source';
import { EndpointDataRegistry } from '../../../../services/endpoint-data/endpoint-data.registry';
import { QuotaDataService, SignalSource } from '../../../../services/endpoint-data/quota-data.service';
import { StOrgQuota } from '../../../../services/endpoint-data/stratos-types';

interface CreateOrganizationForm {
  orgName: FormControl<string>;
  quotaDefinition: FormControl<string | null>;
}

@Component({
  selector: 'app-create-organization-step',
  templateUrl: './create-organization-step.component.html',
  host: { class: 'app-host-flex-1' },
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
export class CreateOrganizationStepComponent implements OnInit, OnDestroy {
  private endpointDataRegistry = inject(EndpointDataRegistry);
  private http = inject(HttpClient);
  private quotaData = inject(QuotaDataService);
  private injector = inject(Injector);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(TailwindSnackBarService);

  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const name = this.orgName.value;
      const quotaGuid = this.quotaDefinition.value;
      try {
        // Route through CnsiOrgsSource so the new org is added to
        // EndpointDataService._orgs immediately and org.create cascade
        // fires. The previous OrgWriteService.createOrg path was a thin
        // http.post that left the canonical cache stale — the new org
        // didn't appear in the list until a hard reload.
        const eds = this.endpointDataRegistry.acquire(this.cfGuid);
        try {
          const source = new CnsiOrgsSource(this.cfGuid, this.http, eds);
          const org = await source.create({ name });
          if (quotaGuid) {
            await firstValueFrom(this.quotaData.applyOrgQuotaToOrgs(this.cfGuid, quotaGuid, [org.guid]));
          }
          this.snackBar.open(`Organization "${name}" created`);
        } finally {
          this.endpointDataRegistry.release(this.cfGuid);
        }
      } catch (err: unknown) {
        throw new Error(`Failed to create organization: ${err instanceof Error ? err.message : String(err)}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  orgSubscription!: Subscription;
  cfGuid: string;
  allOrgs: string[] = [];
  orgs$!: Observable<string[]>;
  cfUrl!: string;
  addOrg!: FormGroup<CreateOrganizationForm>;

  get orgName(): FormControl<string> { return this.addOrg ? this.addOrg.get('orgName') as FormControl<string> : new FormControl('', { nonNullable: true }); }

  get quotaDefinition(): FormControl<string | null> { return this.addOrg ? this.addOrg.get('quotaDefinition') as FormControl<string | null> : new FormControl(null); }

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    this.cfGuid = activatedRoute.snapshot.params.endpointId;
  }

  ngOnInit() {
    this.addOrg = this.fb.group<CreateOrganizationForm>({
      orgName: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator()] }),
      quotaDefinition: new FormControl<string | null>(null),
    });
    this.validSignal.set(this.addOrg.valid);
    this.formStatusSub = this.addOrg.statusChanges.subscribe(
      () => this.validSignal.set(this.addOrg.valid)
    );

    // V3-native: org-name list comes from the EndpointDataService signal.
    const endpointData = this.endpointDataRegistry.acquire(this.cfGuid);
    endpointData.load().subscribe({ error: () => {} });
    endpointData.loadDetails().subscribe({ error: () => {} });
    this.orgs$ = toObservable(endpointData.orgs, { injector: this.injector }).pipe(
      filter(orgs => !!orgs && orgs.length > 0),
      map(orgs => orgs.map(o => o.name)),
      tap(names => this.allOrgs = names),
    );

    // Quota dropdown source — pre-pick when there's only one option.
    this.quotaSource = this.quotaData.orgQuotas(this.cfGuid);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const quotas = this.quotaSource.value();
        if (quotas.length === 1 && this.addOrg && !this.addOrg.value.quotaDefinition) {
          this.addOrg.patchValue({ quotaDefinition: quotas[0].guid });
        }
      });
    });

    this.orgSubscription = this.orgs$.subscribe();
  }

  // Exposed for the template's dropdown.
  quotaSource!: SignalSource<StOrgQuota[]>;

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any, } =>
      !this.validateNameTaken(formField.value) ? { nameTaken: { value: formField.value } } : null;
  };

  validateNameTaken = (value: string = null) => this.allOrgs.length === 0 ? true : this.allOrgs.indexOf(value || this.orgName.value) === -1;

  validate = () => this.validSignal();

  ngOnDestroy() {
    this.orgSubscription?.unsubscribe();
    this.formStatusSub?.unsubscribe();
    this.endpointDataRegistry.release(this.cfGuid);
  }
}
