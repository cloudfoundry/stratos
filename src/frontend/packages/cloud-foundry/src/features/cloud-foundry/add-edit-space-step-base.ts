import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { organizationEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { StepOnNextResult } from '../../../../core/src/shared/components/stepper/step/step.component';
import { getPaginationKey } from '../../../../store/src/actions/pagination.actions';
import { APIResource } from '../../../../store/src/types/api.types';
import { ISpaceQuotaDefinition } from '../../cf-api.types';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { ActiveRouteCfOrgSpace } from './cf-page.types';

export class AddEditSpaceStepBase {
  fetchSpacesSubscription: Subscription;
  orgGuid: string;
  cfGuid: string;
  allSpacesInOrg: string[];
  allSpacesInOrg$: Observable<string[]>;
  validate: (spaceName: string) => boolean;
  quotaDefinitions$: Observable<APIResource<ISpaceQuotaDefinition>[]>;
  hasSpaceQuotas$: Observable<boolean>;

  constructor(
    protected store: Store<CFAppState>,
    protected activatedRoute: ActivatedRoute,
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    this.allSpacesInOrg$ = cfEntityCatalog.space.store.getAllInOrganization.getPaginationService(
      this.orgGuid,
      this.cfGuid,
      getPaginationKey(organizationEntityType, this.orgGuid), {
        flatten: true,
      }
    ).entities$.pipe(
      filter(spaces => !!spaces),
      map(spaces => spaces.map(space => space.entity.name)),
      tap(spaceNames => this.allSpacesInOrg = spaceNames),
      first(),
    );
    this.fetchSpacesSubscription = this.allSpacesInOrg$.subscribe();

    this.quotaDefinitions$ = cfEntityCatalog.spaceQuota.store.getAllInOrganization.getPaginationService(
      this.orgGuid,
      this.cfGuid,
      createEntityRelationPaginationKey(organizationEntityType, this.orgGuid)
    ).entities$.pipe(
      filter(o => !!o),
      first()
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
