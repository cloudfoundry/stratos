import { Component, EventEmitter, InjectionToken, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { buffer, debounceTime, filter, map } from 'rxjs/operators';

import { ActionHistoryDump } from '../../../../../store/src/actions/action-history.actions';
import { ToggleSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../store/src/app-state';
import { TabNavItem } from '../../../../tab-nav.types';
import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';

export const SIDENAV_COPYRIGHT = new InjectionToken<string>('Optional copyright string for side nav');

export interface SideNavItem extends TabNavItem {
  label: string;
  /**
   * deprecated
   */
  text?: string;
  matIcon?: string;
  matIconFont?: string;
  link: string;
  position?: number;
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

  public customizations: CustomizationsMetadata;

  constructor(
    private store: Store<AppState>,
    cs: CustomizationService
  ) {
    this.customizations = cs.get();
  }
  @Input() set iconMode(isIconMode: boolean) {
    if (isIconMode !== this.isIconMode) {
      this.isIconMode = isIconMode;
      this.changedMode.next();
    }
  }
  get iconMode() {
    return this.isIconMode;
  }

  @Input() tabs: SideNavItem[];
  @Output() changedMode = new EventEmitter();
  private isIconMode = true;

  // Button is not always visible on load, so manually push through an event
  logoClicked: BehaviorSubject<any> = new BehaviorSubject(true);

  public toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

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
