import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { CreateOrganization } from '../../../../../../cloud-foundry/src/actions/organization.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { organizationEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationPaginationKey,
} from '../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { selectCfRequestInfo } from '../../../../../../cloud-foundry/src/store/selectors/api.selectors';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog';
import { endpointSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IOrganization, IOrgQuotaDefinition } from '../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';


@Component({
  selector: 'app-create-organization-step',
  templateUrl: './create-organization-step.component.html',
  styleUrls: ['./create-organization-step.component.scss']
})
export class CreateOrganizationStepComponent implements OnInit, OnDestroy {

  orgSubscription: Subscription;
  submitSubscription: Subscription;
  cfGuid: string;
  allOrgs: string[];
  orgs$: Observable<APIResource<IOrganization>[]>;
  quotaDefinitions$: Observable<APIResource<IOrgQuotaDefinition>[]>;
  cfUrl: string;
  addOrg: FormGroup;

  get orgName(): any { return this.addOrg ? this.addOrg.get('orgName') : { value: '' }; }

  get quotaDefinition(): any { return this.addOrg ? this.addOrg.get('quotaDefinition') : { value: '' }; }

  constructor(
    private store: Store<CFAppState>,
    activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    this.cfGuid = activatedRoute.snapshot.params.endpointId;
  }

  ngOnInit() {
    this.addOrg = new FormGroup({
      orgName: new FormControl('', [Validators.required as any, this.nameTakenValidator()]),
      quotaDefinition: new FormControl(),
    });
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

    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid);
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
    )

    this.orgSubscription = this.orgs$.subscribe();
  }

  nameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.validateNameTaken(formField.value) ? { nameTaken: { value: formField.value } } : null;
  }

  validateNameTaken = (value: string = null) => this.allOrgs ? this.allOrgs.indexOf(value || this.orgName.value) === -1 : true;

  validate = () => !!this.addOrg && this.addOrg.valid;

  submit: StepOnNextFunction = () => {
    this.store.dispatch(new CreateOrganization(this.cfGuid, {
      name: this.orgName.value,
      quota_definition_guid: this.quotaDefinition.value
    }));

    return this.store.select(selectCfRequestInfo(organizationEntityType, this.orgName.value)).pipe(
      filter(requestInfo => !!requestInfo && !requestInfo.creating),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create organization: ${requestInfo.message}` : ''
      }))
    );
  }

  ngOnDestroy() {
    this.orgSubscription.unsubscribe();
  }
}
