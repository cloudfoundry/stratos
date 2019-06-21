import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { GetAllOrganizationSpaces } from '../../../../store/src/actions/organization.actions';
import { getPaginationKey } from '../../../../store/src/actions/pagination.actions';
import { GetOrganizationSpaceQuotaDefinitions } from '../../../../store/src/actions/quota-definitions.actions';
import { AppState } from '../../../../store/src/app-state';
import {
  endpointSchemaKey,
  entityFactory,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  organizationSchemaKey,
} from '../../../../store/src/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/src/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../core/cf-api.types';
import { StepOnNextResult } from '../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { ActiveRouteCfOrgSpace } from './cf-page.types';

export class AddEditSpaceStepBase {
  fetchSpacesSubscription: Subscription;
  orgGuid: string;
  cfGuid: string;
  allSpacesInOrg: string[];
  allSpacesInOrg$: Observable<string[]>;
  validate: (spaceName: string) => boolean;
  quotaDefinitions$: Observable<APIResource<IQuotaDefinition>[]>;
  hasSpaceQuotas$: Observable<boolean>;

  constructor(
    protected store: Store<AppState>,
    protected activatedRoute: ActivatedRoute,
    protected paginationMonitorFactory: PaginationMonitorFactory,
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    const paginationKey = getPaginationKey('cf-space', this.orgGuid);

    const action = new GetAllOrganizationSpaces(paginationKey, this.orgGuid, this.cfGuid);

    this.allSpacesInOrg$ = getPaginationObservables<APIResource>(
      {
        store: this.store,
        action,
        paginationMonitor: this.paginationMonitorFactory.create(
          action.paginationKey,
          entityFactory(spaceSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
      map(o => o.map(org => org.entity.name)),
      tap((o) => this.allSpacesInOrg = o)
    );
    this.fetchSpacesSubscription = this.allSpacesInOrg$.subscribe();

    const quotaPaginationKey = createEntityRelationPaginationKey(organizationSchemaKey, this.orgGuid);
    this.quotaDefinitions$ = getPaginationObservables<APIResource<IQuotaDefinition>>(
      {
        store: this.store,
        action: new GetOrganizationSpaceQuotaDefinitions(quotaPaginationKey, this.orgGuid, this.cfGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          quotaPaginationKey,
          entityFactory(spaceQuotaSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(o => !!o),
    );

    this.hasSpaceQuotas$ = this.quotaDefinitions$.pipe(
      map(q => q && q.length > 0)
    );
  }

  destroy(): void {
    this.fetchSpacesSubscription.unsubscribe();
  }

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameValid = this.validate(formField.value);
      return !nameValid ? { spaceNameTaken: { value: formField.value } } : null;
    };
  }

  protected map(errorMessage: string):
    (source: Observable<{ error: boolean, message: string }>) => Observable<StepOnNextResult> {
    return map(o => ({
      success: !o.error,
      redirect: !o.error,
      message: o.error ? errorMessage + o.message : ''
    }));
  }
}
