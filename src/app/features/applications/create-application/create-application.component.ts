import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { GetAllOrganizations } from '../../../store/actions/organization.actions';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss']
})
export class CreateApplicationComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  paginationKey = 'createApplication';

  cfList;

  ngOnInit() {
    this.store.dispatch(new GetAllOrganizations(this.paginationKey));
    // this.store.dispatch(new GetAllSpaces(this.paginationKey));
    // this.store.select(cnsisEntitySelector)
    //   .take(1)
    //   .mergeMap(cfList => Observable.of(cfList.filter(cf => cf.registered)))
    //   .subscribe(cf => this.cfList = cf);

  }

}
