import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { IOrganization, IOrgQuotaDefinition } from '../../../../../../core/src/core/cf-api.types';
import { entityCatalogue } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { IEntityMetadata } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { endpointSchemaKey } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { CFAppState } from '../../../../cf-app-state';
import { cfEntityFactory } from '../../../../cf-entity-factory';
import { organizationEntityType, quotaDefinitionEntityType } from '../../../../cf-entity-types';
import { QuotaDefinitionActionBuilder } from '../../../../entity-action-builders/quota-definition.action-builders';
import { createEntityRelationPaginationKey } from '../../../../entity-relations/entity-relations.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { AddOrganizationService } from '../add-organization.service';



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
    private activatedRoute: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private addOrgService: AddOrganizationService
  ) {
    this.cfGuid = activatedRoute.snapshot.params.endpointId;
    this.addOrgService.cfGuid = this.cfGuid;
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
          entityCatalogue.getEntity(CF_ENDPOINT_TYPE, organizationEntityType).getSchema()
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allOrgs = o)
    );

    const quotaPaginationKey = createEntityRelationPaginationKey(endpointSchemaKey, this.cfGuid);
    const quotaDefinitionEntity = entityCatalogue.getEntity<IEntityMetadata, any, QuotaDefinitionActionBuilder>(
      CF_ENDPOINT_TYPE,
      quotaDefinitionEntityType
    );
    const actionBuilder = quotaDefinitionEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const getQuotaDefinitionsAction = actionBuilder(quotaPaginationKey, this.cfGuid, { includeRelations: [] });
    this.quotaDefinitions$ = getPaginationObservables<APIResource<IOrgQuotaDefinition>>(
      {
        store: this.store,
        action: getQuotaDefinitionsAction,
        paginationMonitor: this.paginationMonitorFactory.create(
          quotaPaginationKey,
          cfEntityFactory(quotaDefinitionEntityType)
        )
      },
      true
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
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.validateNameTaken(formField.value) ? { nameTaken: { value: formField.value } } : null;
  }

  validateNameTaken = (value: string = null) => this.allOrgs ? this.allOrgs.indexOf(value || this.orgName.value) === -1 : true;

  validate = () => !!this.addOrg && this.addOrg.valid;

  onNext: StepOnNextFunction = () => {
    this.addOrgService.orgDetails = {
      name: this.orgName.value,
      quota_definition_guid: this.quotaDefinition.value
    };
    return of({
      success: true
    });
  }

  ngOnDestroy() {
    this.orgSubscription.unsubscribe();
  }
}
