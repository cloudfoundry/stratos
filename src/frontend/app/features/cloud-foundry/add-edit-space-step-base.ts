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

export class AddEditSpaceStepBase {
  submitSubscription: Subscription;
  fetchSpacesSubscription: Subscription;
  orgGuid: string;
  cfGuid: string;
  allSpacesInOrg: string[];
  allSpacesInSpace$: Observable<string[]>;
  validate: (spaceName: string) => boolean;
  constructor(
    protected store: Store<AppState>,
    protected activatedRoute: ActivatedRoute,
    protected paginationMonitorFactory: PaginationMonitorFactory,
    protected snackBar: MatSnackBar,
    protected activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    this.cfGuid = activeRouteCfOrgSpace.cfGuid;
    this.orgGuid = activeRouteCfOrgSpace.orgGuid;
    const paginationKey = getPaginationKey('cf-space', this.cfGuid, this.orgGuid);

    const action = new GetAllOrganizationSpaces(paginationKey, this.orgGuid, this.cfGuid);

    this.allSpacesInSpace$ = getPaginationObservables<APIResource>(
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
    this.fetchSpacesSubscription = this.allSpacesInSpace$.subscribe();

  }

  destroy(): void {
    this.fetchSpacesSubscription.unsubscribe();
    if (this.submitSubscription) {
      this.submitSubscription.unsubscribe();
    }
  }

  displaySnackBar = (message: string) => this.snackBar.open(
    message,
    'Dismiss'
  )

  spaceNameTakenValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } => {
      const nameValid = this.validate(formField.value);
      return !nameValid ? { 'spaceNameTaken': { value: formField.value } } : null;
    };
  }

  protected map(path: string[], errorMessage: string): (source: Observable<RequestInfoState>) => Observable<void> {
    return map(o => {
      if (o.error) {
        this.displaySnackBar(errorMessage);
      } else {
        this.store.dispatch(new RouterNav({
          path: path
        }));
      }
    });
  }

}
