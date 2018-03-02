import { RequestOptions, URLSearchParams } from '@angular/http';
import { Schema } from 'normalizr';

import { EntityInlineChildAction, EntityInlineParentAction } from '../helpers/entity-relations.helpers';
import { CFStartAction } from '../types/request.types';
import { PaginatedAction } from '../types/pagination.types';

const relationActionId = 'FetchRelationAction';

export abstract class FetchRelationAction extends CFStartAction implements EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public endpointGuid: string, // Always go out to a single cf
    public parentGuid: string,
    public parentEntityKey: string,
    private url: string,
    public entity: Schema,
    public entityKey: string,
    // This is the parameter name for the children in the parent entity, for example app `routes` (not the entity key `route`)
    public entityKeyInParent: string,
    public includeRelations: string[],
    public populateMissing = true,
  ) {
    super();
    this.options = new RequestOptions();
    this.options.url = url.startsWith('/v2/') ? url.substring(4, url.length) : url;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
  }
  isId = relationActionId;
  actions = [
    '[Fetch Relations] Start',
    '[Fetch Relations] Success',
    '[Fetch Relations] Failed'
  ];
  options: RequestOptions;
  static is(anything): FetchRelationAction {
    return (anything['isId'] === relationActionId) ? anything as FetchRelationAction : null;
  }
}

export class FetchRelationPaginatedAction extends FetchRelationAction implements PaginatedAction {
  constructor(
    endpointGuid: string, // Always go out to a single cf
    parentGuid: string,
    parentEntityKey: string,
    url: string,
    entity: Schema,
    entityKey: string,
    // This is the parameter name for the children in the parent entity, for example app `routes` (not the entity key `route`)
    entityKeyInParent: string,
    includeRelations: string[],
    public paginationKey: string,
    populateMissing = true,
  ) {
    super(
      endpointGuid,
      parentGuid,
      parentEntityKey,
      url,
      entity,
      entityKey,
      entityKeyInParent,
      includeRelations,
      populateMissing,
    );
  }
  // inline-relations-depth + include-relationships will be automatically calculated
  initialParams = {
    'results-per-page': 100,
    page: 1,
  };
  flattenPagination = true;
}

export class FetchRelationSingleAction extends FetchRelationAction {
  constructor(
    endpointGuid: string, // Always go out to a single cf
    parentGuid: string,
    parentEntityKey: string,
    url: string,
    entity: Schema,
    entityKey: string,
    // This is the parameter name for the children in the parent entity, for example app `routes` (not the entity key `route`)
    entityKeyInParent: string,
    includeRelations: string[],
    populateMissing = true,
  ) {
    super(
      endpointGuid,
      parentGuid,
      parentEntityKey,
      url,
      entity,
      entityKey,
      entityKeyInParent,
      includeRelations,
      populateMissing,
    );
  }
}
