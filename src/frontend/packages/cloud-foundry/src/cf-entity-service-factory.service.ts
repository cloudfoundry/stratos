import { Injectable } from '@angular/core';
import { EntityRequestAction, ICFAction } from '../../store/src/types/request.types';
import { EntityServiceFactory } from '../../core/src/core/entity-service-factory.service';

@Injectable()
export class CFEntityServiceFactory {

  constructor(
    private entityServiceFactory: EntityServiceFactory
  ) { }

  create<T>(
    entityId: string,
    action: EntityRequestAction,
    validate: boolean
  ) {
    const validatedAction = {
      ...action,
      validate
    } as ICFAction;
    return this.entityServiceFactory.create<T>(
      entityId,
      validatedAction,
    );
  }

}
