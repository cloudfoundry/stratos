import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss']
})
export class CreateApplicationComponent implements OnInit {

  constructor(private store: Store<AppState>) { }

  paginationKey = 'createApplication';

  nameValid$: Observable<boolean>;

  @ViewChild('appName')
  appName: NgModel;

  ngOnInit() {

    this.nameValid$ = this.appName.valueChanges
      .mergeMap(() => Observable.of(this.appName.valid))
      .startWith(this.appName.valid);
  }
}
