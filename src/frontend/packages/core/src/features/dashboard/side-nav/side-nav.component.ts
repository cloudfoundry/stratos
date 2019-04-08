import { Component, Inject, InjectionToken, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { buffer, debounceTime, filter, map } from 'rxjs/operators';

import { ActionHistoryDump } from '../../../../../store/src/actions/action-history.actions';
import { AppState } from '../../../../../store/src/app-state';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';


export const SIDENAV_COPYRIGHT = new InjectionToken<string>('Optional copyright string for side nav');

export interface SideNavItem {
  text: string;
  matIcon: string;
  matIconFont?: string;
  link: string;
  hidden?: Observable<boolean>;
  requiresEndpointType?: string;
  requiresPersistence?: boolean;
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
      filter(x => x === 3))
      .subscribe(event => this.store.dispatch(new ActionHistoryDump()));
  }
}
