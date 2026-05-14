import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@stratosui/store';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { filter, map, pairwise, take, tap } from 'rxjs/operators';

import { AppInputDirective, CustomFormFieldComponent, safeUnsubscribe, FocusDirective, SignalStepHandle, StepOnNextFunction, CustomSelectComponent, CustomOptionComponent } from '@stratosui/core';
import { endpointEntityType, PaginationMonitorFactory, ActionState, getPaginationObservables, APIResource } from '@stratosui/store';
import { IOrganization, IOrgQuotaDefinition } from '../../../../cf-api.types';
import { CFAppState } from '../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../cf-entity-factory';
import { organizationEntityType } from '../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../entity-relations/entity-relations.types';
import {
  CloudFoundryUserProvidedServicesService,
} from '../../../../shared/services/cloud-foundry-user-provided-services.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
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
  private store = inject<Store<CFAppState>>(Store);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private cfOrgService = inject(CloudFoundryOrganizationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  /** See QuotaDefinitionFormComponent for rationale. */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /** FWT-957: post-success navigation target supplied by parent. */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: signal-native step handle. Reads validity from validSignal and
   * dispatches the org update via cfEntityCatalog.org.api.update, navigating
   * to the parent-supplied redirectUrl on success. Replaces legacy onNext.
   */
  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      const finalState = await firstValueFrom(
        cfEntityCatalog.org.api.update<ActionState>(this.orgGuid, this.cfGuid, {
          name: this.orgName.value,
          quota_definition_guid: this.quotaDefinition.value,
          status: this.status ? OrgStatus.ACTIVE : OrgStatus.SUSPENDED
        }).pipe(
          pairwise(),
          filter(([oldS, newS]) => oldS.busy && !newS.busy),
          map(([, newS]) => newS),
        )
      );
      if (finalState.error) {
        throw new Error(`Failed to update organization: ${finalState.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  fetchOrgsSub!: Subscription;
  allOrgsInEndpoint: string[];
  allOrgsInEndpoint$!: Observable<string[]>;
  orgSubscription!: Subscription;
  currentStatus!: string;
  originalName!: string;
  org$: Observable<IOrganization>;
  editOrgName: FormGroup<EditOrganizationForm>;
  status: boolean;
  cfGuid: string;
  orgGuid: string;
  quotaDefinitions$!: Observable<APIResource<IOrgQuotaDefinition>[]>;

  get orgName(): FormControl<string> { return this.editOrgName ? this.editOrgName.get('orgName') as FormControl<string> : new FormControl('', { nonNullable: true }); }

  get quotaDefinition(): FormControl<string | null> { return this.editOrgName ? this.editOrgName.get('quotaDefinition') as FormControl<string | null> : new FormControl(null); }

  constructor() {
    const cfOrgService = this.cfOrgService;

    this.orgGuid = cfOrgService.orgGuid;
    this.cfGuid = cfOrgService.cfGuid;
    this.status = false;
    this.allOrgsInEndpoint = [];
    this.editOrgName = this.fb.group<EditOrganizationForm>({
      orgName: new FormControl('', { nonNullable: true, validators: [Validators.required, this.nameTakenValidator()] }),
      quotaDefinition: new FormControl<string | null>(null),
    });
    this.org$ = this.cfOrgService.org$.pipe(
      map(o => o.entity.entity),
      take(1),
      tap(n => {
        this.originalName = n.name;
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
    // Mirror editOrgName.valid && dirty into a signal so the parent
    // page component re-evaluates [valid] automatically. Dirty check
    // keeps the Update button disabled until the user actually edits.
    this.validSignal.set(this.editOrgName.valid && this.editOrgName.dirty);
    this.formStatusSub = this.editOrgName.statusChanges.subscribe(
      () => this.validSignal.set(this.editOrgName.valid && this.editOrgName.dirty)
    );

    const action = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.allOrgsInEndpoint$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          cfEntityFactory(organizationEntityType),
          action.flattenPagination
        )
      },
      action.flattenPagination
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allOrgsInEndpoint = o)
    );
    this.fetchOrgsSub = this.allOrgsInEndpoint$.subscribe();

    const quotaPaginationKey = createEntityRelationPaginationKey(endpointEntityType, this.cfGuid);
    this.quotaDefinitions$ = cfEntityCatalog.quotaDefinition.store.getPaginationService(
      quotaPaginationKey, this.cfGuid, { includeRelations: [] }
    ).entities$.pipe(
      filter(o => !!o),
    );
  }

  /** Name uniqueness check used by the reactive form validator. */
  isNameUnique = (value: string = null): boolean => {
    if (this.allOrgsInEndpoint) {
      return this.allOrgsInEndpoint
        .filter((o: string) => o !== this.originalName)
        .indexOf(value ? value : this.orgName.value) === -1;
    }
    return true;
  }

  /** Form-level validity gate for the Update button. Reads the signal. */
  validate = () => this.validSignal();

  submit: StepOnNextFunction = () => {
    return cfEntityCatalog.org.api.update<ActionState>(this.orgGuid, this.cfGuid, {
      name: this.orgName.value,
      quota_definition_guid: this.quotaDefinition.value,
      status: this.status ? OrgStatus.ACTIVE : OrgStatus.SUSPENDED
    }).pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.busy && !newS.busy),
      map(([, newS]) => newS),
      map(o => ({
        success: !o.error,
        redirect: !o.error,
        message: !o.error ? '' : `Failed to update organization: ${o.message}`
      }))
    );
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.fetchOrgsSub, this.orgSubscription);
    this.formStatusSub?.unsubscribe();
  }
}
