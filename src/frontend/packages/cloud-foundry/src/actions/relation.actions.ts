import { HttpParams, HttpRequest } from '@angular/common/http';

import type { EntityCatalogEntityConfig } from '../../../store/src/entity-catalog/entity-catalog.types';
import type { PaginatedAction } from '../../../store/src/types/pagination.types';
import type { RequestActionEntity } from '../../../store/src/types/request.types';
import type { EntityTreeRelation } from '../entity-relations/entity-relation-tree';
import type { EntityInlineChildAction, EntityInlineParentAction } from '../entity-relations/entity-relations.types';
import { CFStartAction } from './cf-action.types';

const relationActionId = 'FetchRelationAction';

export abstract class FetchRelationAction extends CFStartAction implements EntityInlineParentAction, EntityInlineChildAction {
  entity!: RequestActionEntity;
  entityType: string;
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
    this.entityType = child.entityType;
    this.options = new HttpRequest(
      'GET',
      url.startsWith('/v2/') ? url.substring(4, url.length) : url,
      {
        params: new HttpParams()
      }
    );
    this.parentEntityConfig = parent.entity;
  }
  isId = relationActionId;
  actions = [
    '[Fetch Relations] Start',
    '[Fetch Relations] Success',
    '[Fetch Relations] Failed'
  ];
  options: HttpRequest<unknown>;
  parentEntityConfig: EntityCatalogEntityConfig;
  static is(anything: unknown): FetchRelationAction {
    return (typeof anything === 'object' && anything !== null && 'isId' in anything && (anything as any).isId === relationActionId) ? anything as FetchRelationAction : null;
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
    this.entity = child.entity;
  }
}
