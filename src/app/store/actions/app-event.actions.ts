import { getAPIResourceGuid } from '../selectors/api.selectors';
import { schema } from 'normalizr';

import { ApiActionTypes } from './api.actions';
import { SpaceSchema } from './space.actions';
import { StackSchema } from './stack.action';
import { PaginatedAction, QParam } from '../types/pagination.types';
import { RequestOptions, URLSearchParams } from '@angular/http';

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
  private static sortField = 'timestamp'; // This is the field that 'order-direction' is applied to. Cannot be changed

  constructor(public paginationKey: string, public appGuid: string, public cnis) {
    this.options = new RequestOptions();
    this.options.url = 'events';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.options.params.append('', '');

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
    'order-direction': 'desc',
    'order-direction-field': GetAllAppEvents.sortField,
    q: [
      new QParam('actee', this.appGuid),
    ]
  };
}
