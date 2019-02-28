import { RequestOptions, URLSearchParams } from '@angular/http';

import { EntitySchema } from '../helpers/entity-factory';
import { EntityInlineChildAction, EntityInlineParentAction, EntityTreeRelation } from '../helpers/entity-relations/entity-relations.types';
import { PaginatedAction } from '../types/pagination.types';
import { CFStartAction, IRequestActionEntity, RequestEntityLocation } from '../types/request.types';

const relationActionId = 'FetchRelationAction';

export abstract class FetchRelationAction extends CFStartAction implements EntityInlineParentAction, EntityInlineChildAction {
  constructor(
    public endpointGuid: string, // Always go out to a single cf
    public parentGuid: string,
    public parent: EntityTreeRelation,
    public child: EntityTreeRelation,
    public includeRelations: string[],
    public populateMissing = true,
    public url: string,
  ) {
    super();
    this.entityKey = child.entityKey;
    this.options = new RequestOptions();
    this.options.url = url.startsWith('/v2/') ? url.substring(4, url.length) : url;
    this.options.method = 'get';
    this.options.params = new URLSearchParams();
    this.parentEntitySchema = parent.entity;
  }
  entity: IRequestActionEntity;
  entityKey: string;
  isId = relationActionId;
  actions = [
    '[Fetch Relations] Start',
    '[Fetch Relations] Success',
    '[Fetch Relations] Failed'
  ];
  options: RequestOptions;
  parentEntitySchema: EntitySchema;
  static is(anything): FetchRelationAction {
    return (anything['isId'] === relationActionId) ? anything as FetchRelationAction : null;
  }
}

export class FetchRelationPaginatedAction extends FetchRelationAction implements PaginatedAction {
  constructor(
    endpointGuid: string, // Always go out to a single cf
    parentGuid: string,
    parent: EntityTreeRelation,
    child: EntityTreeRelation,
    includeRelations: string[],
    public paginationKey: string,
    populateMissing = true,
    url: string,
  ) {
    super(
      endpointGuid,
      parentGuid,
      parent,
      child,
      includeRelations,
      populateMissing,
      url,
    );
    this.entity = [child.entity];
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
    parent: EntityTreeRelation,
    public guid: string,
    child: EntityTreeRelation,
    includeRelations: string[],
    populateMissing = true,
    url: string,
  ) {
    super(
      endpointGuid,
      parentGuid,
      parent,
      child,
      includeRelations,
      populateMissing,
      url,
    );
    this.entityLocation = RequestEntityLocation.OBJECT;
    this.entity = child.entity;
  }
  entityLocation: RequestEntityLocation;
}
