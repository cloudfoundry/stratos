import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ActionHistoryDump } from '../../../store/actions/action-history.actions';
import { EndpointsService } from '../../../core/endpoints.service';
import { Subscription } from 'rxjs/Subscription';

export interface SideNavItem {
  text: string;
  matIcon: string;
  link: string;
  endpointType?: string;
  hidden?: boolean;
}

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
})

export class SideNavComponent implements OnInit, OnDestroy {

  constructor(
    private store: Store<AppState>,
    private endpointsService: EndpointsService,
  ) { }

  @Input() tabs: SideNavItem[];
  // Button is not always visible on load, so manually push through an event
  logoClicked: BehaviorSubject<any> = new BehaviorSubject(true);

  sub: Subscription;

  ngOnInit() {
    const toLength = a => a.length;
    const debounced$ = this.logoClicked.debounceTime(250); // debounce the click stream
    this.logoClicked
      .buffer(debounced$)
      .map(toLength)
      .filter(x => x === 3)
      .subscribe(event => this.store.dispatch(new ActionHistoryDump()));

    this.sub = this.endpointsService.endpoints$.map(ep => {
      const connectedTypes = {};
      Object.values(ep).forEach(epData => {
        connectedTypes[epData.cnsi_type] = connectedTypes[epData.cnsi_type] || (epData.connectionStatus === 'connected');
      });
      return connectedTypes;
    }).do(connectedTypes => {
      this.tabs.forEach(tab => {
        if (tab.endpointType) {
          tab.hidden = !connectedTypes[tab.endpointType];
        } else {
          tab.hidden = false;
        }
      });
    }).subscribe();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
