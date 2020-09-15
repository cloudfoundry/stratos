import { Action } from '@ngrx/store';

import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';

export class InitCatalogEntitiesAction implements Action {
  static ACTION_TYPE = '@stratos/add-catalog-entities';
  public type = InitCatalogEntitiesAction.ACTION_TYPE;
  public entityKeys: string[];

  constructor(entities: StratosBaseCatalogEntity[]) {
    this.entityKeys = entities.map(entity => entity.entityKey);
  }
}
