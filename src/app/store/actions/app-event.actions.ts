import { Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { schema } from 'normalizr';

import { getAPIResourceGuid } from './api.actions';
import { APIAction, ApiActionTypes } from './api.actions';
import { SpaceSchema } from './space.actions';
import { StackSchema } from './stack.action';
import { PaginatedAction, PaginationAction } from '../reducers/pagination.reducer';

export const AppGetAllEvents = {
  GET_ALL: '[Application Event] Get all',
  GET_ALL_SUCCESS: '[Application Event] Get all success',
  GET_ALL_FAILED: '[Application Event] Get all failed',
};

export const EventSchema = new schema.Entity('event', {
  entity: {
  }
}, {
    idAttribute: getAPIResourceGuid
  });


export class GetAllAppEvents implements PaginatedAction {
  constructor(public paginationKey: string, public appGuid: string, public cnis) {
    this.options = new RequestOptions();
    this.options.url = 'events';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();

    // order-direction:desc
    // page:1
    // q:actee:e7ba6dbe-dc71-4d40-b2a4-087f139fbf81
    // results-per-page:10
  }
  actions = [
    AppGetAllEvents.GET_ALL,
    AppGetAllEvents.GET_ALL_SUCCESS,
    AppGetAllEvents.GET_ALL_FAILED
  ];

  type = ApiActionTypes.API_REQUEST;
  entity = [EventSchema];
  entityKey = EventSchema.key;
  options: RequestOptions;
  initialParams = {
    'order-direction': 'asc',
    'q': 'actee:' + this.appGuid
  };
}
