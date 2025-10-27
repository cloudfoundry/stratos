import { Component, EventEmitter, InjectionToken, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ToggleSideNav, AppState, Logout } from '@stratosui/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { StratosThemeService } from '../../../../../theme/theme.service';
import { StratosTheme } from '../../../../../theme/theme.config';
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
  styleUrls: ['./side-nav.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})

export class SideNavComponent implements OnInit {

  public customizations: CustomizationsMetadata;
  public navLogo$: Observable<string>;
  public navLogoIcon$: Observable<string>;
  public displayName$: Observable<string>;

  public environment = environment;
  public showAllMenuItems = false;

  tooltipDelay = 0;

  private readonly SHOW_ALL_MENU_ITEMS_KEY = 'stratos-show-all-menu-items';

  constructor(
    private store: Store<AppState>,
    private router: Router,
    cs: CustomizationService,
    private themeService: StratosThemeService
  ) {
    this.customizations = cs.get();
    
    // Get logo paths from theme service
    this.navLogo$ = this.themeService.theme$.pipe(
      map((theme: StratosTheme) => theme?.branding?.navLogo || '/core/assets/logo.png')
    );
    
    this.navLogoIcon$ = this.themeService.theme$.pipe(
      map((theme: StratosTheme) => theme?.branding?.navLogoIcon || '/core/assets/logo.png')
    );

    this.displayName$ = this.themeService.theme$.pipe(
      map((theme: StratosTheme) =>
        theme?.branding?.displayName ||
        theme?.branding?.companyName ||
        'Stratos'
      )
    );
  }
  @Input() set iconMode(isIconMode: boolean) {
    if (isIconMode !== this.isIconMode) {
      this.isIconMode = isIconMode;
      this.changedMode.next(void 0);
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

  public toggleSidenavMode() {
    // Toggle the sidebar open/closed state which controls iconMode
    this.store.dispatch(new ToggleSideNav());
  }

  ngOnInit() {
    // Default to icon mode if the environment specifies a fixed side nav
    if (environment.fixedSideNav) {
      this.isIconMode = true;
      this.tooltipDelay = 2000;
    }

    // Load the show all menu items setting from localStorage
    this.loadShowAllMenuItemsSetting();
  }

  public isActiveRoute(route: string): boolean {
    return this.router.isActive(route, false);
  }

  public getIconName(tab: SideNavItem): string {
    // If matIcon is provided, use it
    if (tab.matIcon && tab.matIcon.trim()) {
      return tab.matIcon;
    }

    // Try to infer icon from label/text
    const label = (tab.label || tab.text || '').toLowerCase();

    // Common icon mappings based on label
    const iconMap: { [key: string]: string } = {
      'home': 'home',
      'application': 'apps',
      'apps': 'apps',
      'marketplace': 'store',
      'market': 'store',
      'service': 'cloud',
      'cloud foundry': 'cloud',
      'cloud': 'cloud',
      'endpoint': 'settings',
      'kubernetes': 'settings',
      'metric': 'analytics',
      'user': 'person',
      'organization': 'business',
      'space': 'folder',
      'domain': 'domain',
      'security': 'security',
      'admin': 'admin_panel_settings'
    };

    // Look for matching icon in the map
    for (const [key, icon] of Object.entries(iconMap)) {
      if (label.includes(key)) {
        return icon;
      }
    }

    // Default fallback
    return 'dashboard';
  }

  public signOut() {
    this.store.dispatch(new Logout());
  }

  public toggleShowAllMenuItems(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.showAllMenuItems = checkbox.checked;
    this.saveShowAllMenuItemsSetting();
  }

  private loadShowAllMenuItemsSetting() {
    try {
      const saved = localStorage.getItem(this.SHOW_ALL_MENU_ITEMS_KEY);
      this.showAllMenuItems = saved === 'true';
    } catch (error) {
      console.warn('Failed to load show all menu items setting:', error);
      this.showAllMenuItems = false;
    }
  }

  private saveShowAllMenuItemsSetting() {
    try {
      localStorage.setItem(this.SHOW_ALL_MENU_ITEMS_KEY, this.showAllMenuItems.toString());
    } catch (error) {
      console.warn('Failed to save show all menu items setting:', error);
    }
  }
}
