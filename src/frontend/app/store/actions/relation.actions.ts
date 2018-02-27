import { RequestOptions, URLSearchParams } from '@angular/http';
import { Schema } from 'normalizr';

import { EntityInlineChildAction } from '../helpers/entity-relations.helpers';
import { CFStartAction } from '../types/request.types';

export class FetchRelationAction extends CFStartAction implements EntityInlineChildAction {
  static isIdString = 'FetchRelationAction';
  constructor(
    public endpointGuid: string, // Always go out to a single cf
    public parentGuid: string,
    public parentEntityKey: string,
    private url: string,
    public entity: Schema,
    public entityKey: string,
    // This is the parameter name for the children in the parent entity, for example app `routes` (not the entity key `route`)
    public entityKeyInParent: string,
    public paginationKey: string
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = url.startsWith('/v2/') ? url.substring(4, url.length) : url;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  isId = FetchRelationAction.isIdString;
  actions = [
    '[Fetch Relations] Start',
    '[Fetch Relations] Success',
    '[Fetch Relations] Failed'
  ];
  // inline-relations-depth + include-relationships will be automatically calculated
  initialParams = {
    'results-per-page': 100,
    page: 1,
  };
  flattenPagination = true;
  options: RequestOptions;
  static is(anything): FetchRelationAction {
    return (anything['isId'] === FetchRelationAction.isIdString) ? anything as FetchRelationAction : null;
  }
}
