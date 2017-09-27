import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { IsNewAppNameFree, NewAppCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';

@Component({
  selector: 'app-create-application-step2',
  templateUrl: './create-application-step2.component.html',
  styleUrls: ['./create-application-step2.component.scss']
})
export class CreateApplicationStep2Component implements OnInit {

  constructor(private store: Store<AppState>) { }

  nameValid$: Observable<boolean>;

  @ViewChild('appName')
  appName: NgModel;

  isFetching: boolean;

  cfDetails: NewAppCFDetails;

  ngOnInit() {
    this.appName.valueChanges
      .debounceTime(300)
      .subscribe(name => {
        if (name) {
          this.store.dispatch(new IsNewAppNameFree(name));
        }
      });
  }

}
