import { Component, EventEmitter, InjectionToken, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { ToggleSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { AppState } from '../../../../../store/src/app-state';
import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { environment } from '../../../environments/environment';
import { TabNavItem } from '../../../tab-nav.types';

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

  public environment = environment;

  tooltipDelay = 0;

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

  public toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  ngOnInit() {
    // Default to icon mode if the environment specifies a fixed side nav
    if (environment.fixedSideNav) {
      this.isIconMode = true;
      this.tooltipDelay = 2000;
    }
  }
}
