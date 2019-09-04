import { Injectable } from '@angular/core';

import { EntityServiceFactory } from '../../core/src/core/entity-service-factory.service';
import { EntityRequestAction, ICFAction } from '../../store/src/types/request.types';

@Injectable()
export class CFEntityServiceFactory {

  constructor(
    private entityServiceFactory: EntityServiceFactory
  ) { }

  create<T>(
    entityId: string,
    action: EntityRequestAction,
    validate: boolean = false
  ) {
    const validatedAction = {
      ...action,
      validate: false
    } as ICFAction;
    return this.entityServiceFactory.create<T>(
      entityId,
      validatedAction,
    );
  }

}
