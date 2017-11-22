import { GetAllApplications } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, AfterContentInit {

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
  }

  ngAfterContentInit() {
  }

}
