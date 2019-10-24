import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, tap } from 'rxjs/operators';

import { IUpdateOrganization } from '../../../../../core/src/core/cf-api.types';
import { entityCatalogue } from '../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { StepOnNextFunction } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { AppState } from '../../../../../store/src/app-state';
import { selectRequestInfo } from '../../../../../store/src/selectors/api.selectors';
import { CreateOrganization } from '../../../actions/organization.actions';


@Injectable()
export class AddOrganizationService {
  public cfGuid: string;
  public orgDetails: IUpdateOrganization;

  constructor(
    private store: Store<AppState>,
  ) {

  }

  createOrg: StepOnNextFunction = () => {
    const action = new CreateOrganization(this.cfGuid, this.orgDetails);
    this.store.dispatch(action);
    const entityKey = entityCatalogue.getEntityKey(action);


    // TODO: RC How did this work??
    return this.store.select(selectRequestInfo(entityKey, this.orgDetails.name)).pipe(
      tap(a => console.log('create', a)),
      filter(requestInfo => !!requestInfo && !requestInfo.creating),
      map(requestInfo => ({
        success: !requestInfo.error,
        redirect: !requestInfo.error,
        message: requestInfo.error ? `Failed to create organization: ${requestInfo.message}` : ''
      }))
    );
  }



}
