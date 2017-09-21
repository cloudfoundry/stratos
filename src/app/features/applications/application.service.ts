import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { getEntity } from '../../store/actions/api.actions';
import { ApplicationSchema, GetApplication } from '../../store/actions/application.actions';

@Injectable()
export class ApplicationService {

  constructor(private store: Store<AppState>) { }

  application: Observable<any>;

  SetApplication(cfId, id) {
    if (!this.application) {
      this.application = getEntity(
        this.store,
        ApplicationSchema.key,
        ApplicationSchema,
        id,
        new GetApplication(id, cfId)
      )
    }
  }

  GetApplication(): Observable<any> {
    return this.application;
  }

  UpdateApplication() {
    console.log('NOT IMPLEMENTED');
  }

}
