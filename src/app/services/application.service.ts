import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { getEntity } from '../store/actions/api.actions';
import { ApplicationSchema, GetApplication } from '../store/actions/application.actions';

@Injectable()
export class ApplicationService {

  constructor(private store: Store<AppState>) { }

  // applications: Map<string, Map<string, Observable<any>>> = new Map<string, Map<string, Observable<any>>>();
  application: Observable<any>;

  SetApplication(cfId, id) {

    console.log('ApplicationService SetApplication')
    // if (!this.applications.has(this.cfId)) {
    //   this.applications.set(this.cfId, new Map<string, Observable<any>>())
    // }
    // let cf = this.applications.get(this.cfId);

    // if (!cf.has(this.id)) {
    //   cf.set(this.id, getEntity(
    //     this.store,
    //     ApplicationSchema.key,
    //     ApplicationSchema,
    //     id,
    //     new GetApplication(this.id, cfId)
    //   ))
    // }
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
