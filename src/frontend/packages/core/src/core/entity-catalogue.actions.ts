import { StratosBaseCatalogueEntity } from './entity-catalogue/entity-catalogue-entity';
import { Action } from '@ngrx/store';

export class InitCatalogueEntitiesAction implements Action {
  static ACTION_TYPE = '@stratos/add-catalogue-entities';
  public type = InitCatalogueEntitiesAction.ACTION_TYPE;
  public entityKeys: string[];

  constructor(entities: StratosBaseCatalogueEntity[]) {
    this.entityKeys = entities.map(entity => entity.entityKey);
  }
}
