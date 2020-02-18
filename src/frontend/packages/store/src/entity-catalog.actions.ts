import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity';
import { Action } from '@ngrx/store';

export class InitCatalogEntitiesAction implements Action {
  static ACTION_TYPE = '@stratos/add-catalog-entities';
  public type = InitCatalogEntitiesAction.ACTION_TYPE;
  public entityKeys: string[];

  constructor(entities: StratosBaseCatalogEntity[]) {
    this.entityKeys = entities.map(entity => entity.entityKey);
  }
}
