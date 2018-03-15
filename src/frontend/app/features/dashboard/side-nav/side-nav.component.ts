import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ActionHistoryDump } from '../../../store/actions/action-history.actions';

export interface SideNavItem {
  text: string;
  matIcon: string;
  link: string;
  hidden?: boolean;
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})

export class SideNavComponent implements OnInit {

  constructor(private store: Store<AppState>, ) { }

  @Input() tabs: SideNavItem[];
  // Button is not always visible on load, so manually push through an event
  logoClicked: BehaviorSubject<any> = new BehaviorSubject(true);


  ngOnInit() {
    const toLength = a => a.length;
    const debounced$ = this.logoClicked.debounceTime(250); // debounce the click stream
    this.logoClicked
      .buffer(debounced$)
      .map(toLength)
      .filter(x => x === 3)
      .subscribe(event => this.store.dispatch(new ActionHistoryDump()));
  }


}
