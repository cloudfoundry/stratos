import { Component, EventEmitter, InjectionToken, Input, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { ToggleSideNav, AppState } from '@stratosui/store';
import { Observable } from 'rxjs';

import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
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

export class SideNavComponent {

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

  public toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }
}
