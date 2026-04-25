import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidatorFn, Validators, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { AppInputDirective, CustomFormFieldComponent, CustomSelectComponent, CustomOptionComponent, FocusDirective, SignalStepHandle, StepOnNextFunction } from '@stratosui/core';
import {
  APIResource,
  endpointEntityType,
  entityCatalog,
  getPaginationObservables,
  PaginationMonitorFactory
} from '@stratosui/store';
import { CreateOrganization } from '../../../../actions/organization.actions';
import { IOrgQuotaDefinition } from '../../../../cf-api.types';
import { CFAppState } from '../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { organizationEntityType } from '../../../../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { createEntityRelationPaginationKey } from '../../../../entity-relations/entity-relations.types';
import { selectCfRequestInfo } from '../../../../store/selectors/api.selectors';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

interface CreateOrganizationForm {
  orgName: FormControl<string>;
  quotaDefinition: FormControl<string | null>;
}

@Component({
  selector: 'app-create-organization-step',
  templateUrl: './create-organization-step.component.html',
  styleUrls: ['./create-organization-step.component.scss'],
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
  private store = inject<Store<CFAppState>>(Store);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  /** See QuotaDefinitionFormComponent — mirror form validity into a signal
   *  so the parent AddOrganizationComponent (OnPush, off the ngTemplateOutlet
   *  chain) re-evaluates [valid]="step1.validate()" automatically. */
  private validSignal = signal(false);
  private formStatusSub?: Subscription;

  /**
   * FWT-957: post-success navigation target. Parent supplies the same URL
   * it passes to <app-steppers cancel> so the new SignalStepHandle.submit
   * Promise resolves with explicit Router.navigate instead of the legacy
   * `redirect: true` previous-route lookup.
   */
  @Input() redirectUrl!: string;

  /**
   * FWT-957: signal-native step handle. Exposes form validity via a Signal
   * and dispatches CreateOrganization, awaiting the request-info store
   * slice for completion before navigating to the orgs list. Replaces the
   * legacy [valid]/[onNext] inputs on the parent <app-step>.
   */
  signalHandle: SignalStepHandle = {
    valid: this.validSignal.asReadonly(),
    submit: async () => {
      this.store.dispatch(new CreateOrganization(this.cfGuid, {
        name: this.orgName.value,
        quota_definition_guid: this.quotaDefinition.value ?? undefined
      }));
      const requestInfo = await firstValueFrom(
        this.store.select(selectCfRequestInfo(organizationEntityType, this.orgName.value)).pipe(
          filter(r => !!r && !r.creating)
        )
      );
      if (requestInfo.error) {
        throw new Error(`Failed to create organization: ${requestInfo.message}`);
      }
      await this.router.navigateByUrl(this.redirectUrl);
    },
  };

  orgSubscription!: Subscription;
  submitSubscription!: Subscription;
  cfGuid: string;
  allOrgs!: string[];
  orgs$!: Observable<string[]>;
  quotaDefinitions$!: Observable<APIResource<IOrgQuotaDefinition>[]>;
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
    const action = CloudFoundryEndpointService.createGetAllOrganizations(this.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityCatalog.getEntity(CF_ENDPOINT_TYPE, organizationEntityType).getSchema(),
          action.flattenPagination
        )
      },
      action.flattenPagination
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allOrgs = o)
    );

    const quotaPaginationKey = createEntityRelationPaginationKey(endpointEntityType, this.cfGuid);
    this.quotaDefinitions$ = cfEntityCatalog.quotaDefinition.store.getPaginationService(
      quotaPaginationKey, this.cfGuid, { includeRelations: [] }
    ).entities$.pipe(
      filter(o => !!o),
      tap(quotas => {
        if (quotas.length === 1) {
          this.addOrg.patchValue({
            quotaDefinition: quotas[0].metadata.guid
          });
        }
      })
    );

    this.orgSubscription = this.orgs$.subscribe();
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any, } =>
      !this.validateNameTaken(formField.value) ? { nameTaken: { value: formField.value } } : null;
  };

  validateNameTaken = (value: string = null) => this.allOrgs ? this.allOrgs.indexOf(value || this.orgName.value) === -1 : true;

  validate = () => this.validSignal();

  submit: StepOnNextFunction = () => {
    this.store.dispatch(new CreateOrganization(this.cfGuid, {
      name: this.orgName.value,
      quota_definition_guid: this.quotaDefinition.value ?? undefined
    }));

    return this.store.select(selectCfRequestInfo(organizationEntityType, this.orgName.value)).pipe(
      filter(requestInfo => !!requestInfo && !requestInfo.creating),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create organization: ${requestInfo.message}` : ''
      }))
    );
  };

  ngOnDestroy() {
    this.orgSubscription.unsubscribe();
    this.formStatusSub?.unsubscribe();
  }
}
