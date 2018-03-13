import { RequestOptions, URLSearchParams } from '@angular/http';

import { appEventSchemaKey, entityFactory } from '../helpers/entity-factory';
import { PaginatedAction, QParam } from '../types/pagination.types';
import { CFStartAction } from '../types/request.types';

export const AppGetAllEvents = {
  GET_ALL: '[Application Event] Get all',
  GET_ALL_SUCCESS: '[Application Event] Get all success',
  GET_ALL_FAILED: '[Application Event] Get all failed',
};

export class GetAllAppEvents extends CFStartAction implements PaginatedAction {
  private static sortField = 'timestamp'; // This is the field that 'order-direction' is applied to. Cannot be changed

  constructor(public paginationKey: string, public appGuid: string, public endpointGuid) {
    super();
    this.options = new RequestOptions();
    this.options.url = 'events';
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.options.params.append('', '');
  }
  actions = [
    AppGetAllEvents.GET_ALL,
    AppGetAllEvents.GET_ALL_SUCCESS,
    AppGetAllEvents.GET_ALL_FAILED
  ];

  entity = [entityFactory(appEventSchemaKey)];
  entityKey = appEventSchemaKey;
  options: RequestOptions;
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': GetAllAppEvents.sortField,
    q: [
      new QParam('actee', this.appGuid),
    ]
  };
}
