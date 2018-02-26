import { RequestOptions, URLSearchParams } from '@angular/http';
import { Schema } from 'normalizr';

import { EntityInlineChildAction } from '../helpers/entity-relations.helpers';
import { CFStartAction } from '../types/request.types';

export class FetchRelationAction extends CFStartAction implements EntityInlineChildAction {
  constructor(
    public endpointGuid: string, // Always go out to a single cf
    public parentGuid: string, // TODO: RC is this needed??
    private url: string,
    public entity: Schema,
    public entityKey: string,
    public paginationKey: string
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = url;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
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
}
