import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { AppState } from '../../store/app-state';
import { ActivatedRoute } from '@angular/router';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { MatSnackBar } from '@angular/material';
import { getPaginationObservables } from '../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../store/types/api.types';
import { getPaginationKey } from '../../store/actions/pagination.actions';
import { filter, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { RequestInfoState } from '../../store/reducers/api-request-reducer/types';
import { RouterNav } from '../../store/actions/router.actions';
import { ActiveRouteCfOrgSpace } from './cf-page.types';
import { getIdFromRoute } from './cf.helpers';
import { ValidatorFn, AbstractControl } from '@angular/forms';
import { entityFactory, spaceSchemaKey, organizationSchemaKey } from '../../store/helpers/entity-factory';
import { GetAllOrganizationSpaces } from '../../store/actions/organization.actions';
import { createEntityRelationPaginationKey } from '../../store/helpers/entity-relations.types';
import { StepOnNextResult } from '../../shared/components/stepper/step/step.component';

export class AddEditSpaceStepBase {
  fetchSpacesSubscription: Subscription;
  orgGuid: string;
  cfGuid: string;
  allSpacesInOrg: string[];
  allSpacesInOrg$: Observable<string[]>;
  validate: (spaceName: string) => boolean;
  constructor(
    protected store: Store<AppState>,
    protected activatedRoute: ActivatedRoute,
    protected paginationMonitorFactory: PaginationMonitorFactory,
    // protected snackBar: MatSnackBar,// TODO: RC search and remove not needed
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    const paginationKey = getPaginationKey('cf-space', this.cfGuid, this.orgGuid);

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

  }

  destroy(): void {
    this.fetchSpacesSubscription.unsubscribe();
  }

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameValid = this.validate(formField.value);
      return !nameValid ? { 'spaceNameTaken': { value: formField.value } } : null;
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
