import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { DashboardDataService } from '../../../core/dashboard-data.service';
import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { environment } from '../../../environments/environment';
import { TabNavItem } from '../../../tab-nav.types';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SideNavComponent implements OnInit {
  private router = inject(Router);
  private branding = inject(StratosBrandingService);
  private dashboardData = inject(DashboardDataService);
  private authSignals = inject(AuthSignalService);


  public customizations: CustomizationsMetadata;

  // Theme-related signals (computed from branding service)
  public navLogo = computed(() =>
    this.branding.theme()?.branding?.navLogo || '/core/assets/logo.png'
  );

  public navLogoIcon = computed(() =>
    this.branding.theme()?.branding?.navLogoIcon || '/core/assets/logo.png'
  );

  public displayName = computed(() =>
    this.branding.theme()?.branding?.displayName ||
    this.branding.theme()?.branding?.companyName ||
    'Stratos'
  );

  public copyright = computed(() => this.branding.getCopyrightText());

  public environment = environment;
  public showAllMenuItems = false;

  tooltipDelay = 0;

  private readonly SHOW_ALL_MENU_ITEMS_KEY = 'stratos-show-all-menu-items';

  constructor() {
    const cs = inject(CustomizationService);

    this.customizations = cs.get();
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

  @Input() tabs: SideNavItem[] = [];
  @Output() changedMode = new EventEmitter();
  private isIconMode = true;

  public toggleSidenav() {
    this.dashboardData.toggleSideNav();
  }

  public toggleSidenavMode() {
    // Toggle the sidebar open/closed state which controls iconMode
    this.dashboardData.toggleSideNav();
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
    this.authSignals.logout();
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
