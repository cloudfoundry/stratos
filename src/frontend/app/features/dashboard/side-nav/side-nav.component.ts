
import { filter, map, buffer, debounceTime } from 'rxjs/operators';
import { Component, Inject, InjectionToken, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';
import { ActionHistoryDump } from '../../../store/actions/action-history.actions';
import { AppState } from '../../../store/app-state';

export const SIDENAV_COPYRIGHT = new InjectionToken<string>('Optional copyright string for side nav');

export interface SideNavItem {
  text: string;
  matIcon: string;
  matIconFont?: string;
  link: string;
  hidden?: Observable<boolean>;
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})

export class SideNavComponent implements OnInit {

  constructor(
    private store: Store<AppState>,
    @Inject(Customizations) public customizations: CustomizationsMetadata
  ) { }

  @Input() tabs: SideNavItem[];
  // Button is not always visible on load, so manually push through an event
  logoClicked: BehaviorSubject<any> = new BehaviorSubject(true);

  ngOnInit() {
    const toLength = a => a.length;
    const debounced$ = this.logoClicked.pipe(debounceTime(250)); // debounce the click stream
    this.logoClicked.pipe(
      buffer(debounced$),
      map(toLength),
      filter(x => x === 3), )
      .subscribe(event => this.store.dispatch(new ActionHistoryDump()));
  }
}
