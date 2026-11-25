import { ChangeDetectionStrategy, Component, OnInit, Signal, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, UrlTree } from '@angular/router';
import { filter } from 'rxjs/operators';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { StratosCurrentUserPermissions } from '../../../core/permissions/stratos-user-permissions.checker';
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
  hidden?: Signal<boolean>;
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
  private permissionsService = inject(CurrentUserPermissionsService);

  // Same guard the page header uses: the 'stratos.noauth' scope means there
  // is no session to end, so offering Sign Out is meaningless.
  private readonly noLogout = this.permissionsService.can(StratosCurrentUserPermissions.CAN_NOT_LOGOUT);
  public readonly canLogout = computed(() => !this.noLogout());

  // HIDE_NAV_LOGOUT removes this button only. The header user menu keeps its
  // own Sign Out, so hiding it here is presentation, not a capability change.
  public hideNavLogout = computed(() => !!this.authSignals.sessionData()?.config?.hideNavLogout);


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

  // Operator-configured company links. website is https-validated by the service.
  public companyWebsite = computed(() => this.branding.getCompanyWebsite());
  public supportEmail = computed(() => this.branding.getSupportEmail());

  public environment = environment;
  public showAllMenuItems = false;

  /** Debug affordance (c5c1009a85): only rendered when the deployment's
   *  company config opts in via debug.showAllMenuItemsToggle. */
  public showMenuItemsToggle = computed(() => this.branding.getShowAllMenuItemsToggle());

  /** Effective reveal flag: a saved preference counts only while the debug
   *  toggle is available — a hidden checkbox must not leak hidden nav items. */
  get revealHiddenItems(): boolean {
    return this.showMenuItemsToggle() && this.showAllMenuItems;
  }

  tooltipDelay = 0;

  private readonly SHOW_ALL_MENU_ITEMS_KEY = 'stratos-show-all-menu-items';

  constructor() {
    const cs = inject(CustomizationService);

    this.customizations = cs.get();

    // Tell the host each time the bound mode changes.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.url.set(this.router.url));
    effect(() => {
      const url = this.url();
      const link = this.itemFor(url);
      if (link) {
        this.lastPages.update(pages => ({ ...pages, [link]: url }));
      }
    });

    let boundMode = true;
    effect(() => {
      const mode = this.iconMode();
      if (mode !== boundMode) {
        boundMode = mode;
        this.changedMode.emit(void 0);
      }
    });
  }

  // Icons only, as the dashboard binds it.
  readonly iconMode = input(true);
  // The mode shown: the bound one, except that a fixed side nav starts in
  // icon mode whatever is bound (ngOnInit).
  readonly isIconMode = linkedSignal(() => this.iconMode());

  readonly tabs = input<SideNavItem[]>([]);
  readonly changedMode = output();

  // The page shown, and the last page visited under each item by its link.
  // Kept for the dashboard's life only: a reload or the login page forgets it.
  private readonly url = signal(this.router.url);
  private readonly lastPages = signal<Record<string, string>>({});

  // The item whose link is the longest match for a page, if any.
  private itemFor(url: string): string | undefined {
    const path = url.split(/[?#]/)[0];
    return this.tabs().map(t => t.link)
      .filter(link => path === link || path.startsWith(link + '/'))
      .sort((a, b) => b.length - a.length)[0];
  }

  // Where each item goes: the last page visited under it, or its top when
  // that page is unknown or the user is already in its section.
  readonly targets = computed(() => {
    const here = this.itemFor(this.url());
    const last = this.lastPages();
    return new Map<string, string | UrlTree>(this.tabs().map(t => [t.link,
      t.link !== here && last[t.link] ? this.router.parseUrl(last[t.link]) : t.link]));
  });

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
      this.isIconMode.set(true);
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
