import { RequestOptions } from '@angular/http';
import { Action, compose, createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';
import { Observable } from 'rxjs/Rx';

import { EntitiesState } from '../reducers/entity.reducer';
import { AppState } from './../app-state';
import { EntityRequestState } from './../reducers/api-request-reducer';

export const AppMetadataTypes = {
  APP_METADATA: '[App Metadata] App Metadata',
  APP_METADATA_SUCCESS: '[App Metadata] App Metadata success',
  APP_METADATA_FAILED: '[App Metadata] App Metadata failed'
};

//FIXME: 
export type AppMetadataType = 'summary' | 'instances' | 'environmentVars';

export class GetMetadataAction implements Action {
  constructor(
    public guid: string,
    public cnis: string,
    public metadataType: AppMetadataType
  ) {
    this.options = this.getRequestOptions(cnis, guid, metadataType);
  }

  type = AppMetadataTypes.APP_METADATA;

  private getRequestOptions(guid: string, cnis: string, type: AppMetadataType) {
    let requestObject;
    switch (type) {
      case 'summary':
        requestObject = new RequestOptions({
          url: `apps/${guid}/summary`,
          method: 'get'
        });
        break;
    }
  }


  // url?: string | null;
  // method?: string | RequestMethod | null;
  // /** @deprecated from 4.0.0. Use params instead. */
  // search?: string | URLSearchParams | {
  //     [key: string]: any | any[];
  // } | null;
  // params?: string | URLSearchParams | {
  //     [key: string]: any | any[];
  // } | null;
  // headers?: Headers | null;
  // body?: any;
  // withCredentials?: boolean | null;
  // responseType?: ResponseContentType | null;


}

