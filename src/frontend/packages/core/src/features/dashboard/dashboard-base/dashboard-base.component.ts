import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { CdkPortalOutlet, type Portal, PortalModule } from "@angular/cdk/portal";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { AsyncPipe, CommonModule, NgClass } from "@angular/common";
import {
	type AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	type ElementRef,
	NgZone,
	type OnDestroy,
	type OnInit,
	ViewChild,
	ViewContainerRef,
	inject,
} from "@angular/core";
import {
	ActivatedRoute,
	type ActivatedRouteSnapshot,
	NavigationEnd,
	type Route,
	Router,
	RouterLink,
	RouterModule,
} from "@angular/router";
import { Store } from "@ngrx/store";
import {
	CloseSideNav,
	type DashboardOnlyAppState,
	type DashboardState,
	DisableMobileNav,
	EnableMobileNav,
	entityCatalog,
	GetCurrentUsersRelations,
	selectDashboardState,
	stratosEntityCatalog,
} from "@stratosui/store";
import { combineLatest, type Observable, of, type Subscription } from "rxjs";
import {
	distinctUntilChanged,
	filter,
	map,
	startWith,
	withLatestFrom,
} from "rxjs/operators";
import { CustomizationService } from "../../../core/customizations.types";
import { EndpointsService } from "../../../core/endpoints.service";
import { PageHeaderService } from "./../../../core/page-header-service/page-header.service";
import type { IHeaderBreadcrumbLink } from "../../../shared/components/page-header/page-header.types";
import { ShowPageHeaderComponent } from "../../../shared/components/page-header/show-page-header/show-page-header.component";
import { RoutingIndicatorComponent } from "../../../shared/components/routing-indicator/routing-indicator.component";
import {
	SidePanelMode,
	SidePanelService,
} from "../../../shared/services/side-panel.service";
import type { MatDrawer } from "../../../shared/services/tailwind-material-replacements";
import { TabNavService } from "../../../tab-nav.service";
import {
	type IPageSideNavTab,
	PageSideNavComponent,
} from "../page-side-nav/page-side-nav.component";
import {
	SideNavComponent,
	type SideNavItem,
} from "./../side-nav/side-nav.component";

@Component({
	selector: "app-dashboard-base",
	templateUrl: "./dashboard-base.component.html",
	styleUrls: ["./dashboard-base.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		PortalModule,
		ScrollingModule,
		AsyncPipe,
		NgClass,
		RouterLink,
		CdkPortalOutlet,
		SideNavComponent,
		PageSideNavComponent,
		ShowPageHeaderComponent,
		RoutingIndicatorComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardBaseComponent
	implements OnInit, OnDestroy, AfterViewInit
{
	public activeTabLabel$!: Observable<string>;
	public subNavData$!: Observable<
		[string, Portal<unknown>, IPageSideNavTab, IHeaderBreadcrumbLink[]]
	>;
	public isMobile$: Observable<boolean> = of(false);
	public sideNavMode$!: Observable<string>;
	public sideNavMode!: string;
	public mainNavState$: Observable<{
		mode: string;
		opened: boolean;
		iconMode: boolean;
	}> = of({ mode: "side", opened: true, iconMode: false });
	public rightNavState$!: Observable<{
		opened: boolean;
		component?: object;
		props?: object;
	}>;
	private dashboardState$: Observable<DashboardState> = of(
		{} as DashboardState,
	);
	public noMargin$: Observable<boolean> = of(false);
	private closeSub!: Subscription;
	private mobileSub: Subscription;
	private drawer: MatDrawer;
	public iconModeOpen = false;
	public sideNavWidth = 54;

	sideNavTabs: SideNavItem[] = this.getNavigationRoutes();
	sideNaveMode = "side";

	@ViewChild("previewPanelContainer", { read: ViewContainerRef, static: false })
	previewPanelContainer!: ViewContainerRef;

	@ViewChild("content", { static: false }) public content: ElementRef;

	// Slide-in side panel mode
	sidePanelMode: SidePanelMode = SidePanelMode.Modal;

	public pageHeaderService = inject(PageHeaderService);
	private store = inject(Store<DashboardOnlyAppState>);
	private breakpointObserver = inject(BreakpointObserver);
	private router = inject(Router);
	private activatedRoute = inject(ActivatedRoute);
	private endpointsService = inject(EndpointsService);
	public tabNavService = inject(TabNavService);
	private ngZone = inject(NgZone);
	public sidePanelService = inject(SidePanelService);
	private cs = inject(CustomizationService);

	constructor() {
		this.noMargin$ = this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map(() => this.isNoMarginView(this.activatedRoute.snapshot)),
			startWith(this.isNoMarginView(this.activatedRoute.snapshot)),
		);
		this.isMobile$ = this.breakpointObserver
			.observe([Breakpoints.Small, Breakpoints.XSmall])
			.pipe(
				map((breakpoint) => breakpoint.matches),
				startWith(false),
				distinctUntilChanged(),
			);
		this.dashboardState$ = this.store.select(selectDashboardState);
		this.mainNavState$ = this.dashboardState$.pipe(
			map((state) => {
				if (state.isMobile) {
					return {
						mode: "over",
						opened: state.isMobileNavOpen || false,
						iconMode: false,
					};
				} else {
					return {
						mode: state.sideNavPinned ? "side" : "over",
						opened: true,
						iconMode: !state.sidenavOpen,
					};
				}
			}),
		);

		this.mobileSub = this.isMobile$.subscribe((isMobile) =>
			isMobile
				? this.store.dispatch(new EnableMobileNav())
				: this.store.dispatch(new DisableMobileNav()),
		);
	}

	@ViewChild("sidenav") set sidenav(drawer: MatDrawer) {
		this.drawer = drawer;
		if (!this.closeSub && drawer && drawer.closedStart) {
			// We need this for mobile to ensure the state is synced when the dashboard is closed by clicking on the backdrop.
			this.closeSub = drawer.closedStart
				.pipe(withLatestFrom(this.dashboardState$))
				.subscribe(([_change, state]: [void, DashboardState]) => {
					if (state.isMobile) {
						this.store.dispatch(new CloseSideNav());
					}
				});
		}
	}

	public redrawSideNav() {
		// We need to do this to ensure there isn't a space left behind
		// when going from mobile to desktop
		if (this.drawer?._modeChanged) {
			this.ngZone.runOutsideAngular(() => {
				setTimeout(() => this.drawer._modeChanged.next(), 250);
			});
		}
	}

	dispatchRelations() {
		this.store.dispatch(new GetCurrentUsersRelations());
	}

	sideHelpClosed() {
		this.sidePanelService.hide();
	}

	ngAfterViewInit() {
		this.sidePanelService.setContainer(this.previewPanelContainer);
	}

	ngOnInit() {
		this.subNavData$ = combineLatest([
			this.tabNavService.getCurrentTabHeaderObservable().pipe(startWith(null)),
			this.tabNavService.tabSubNav$,
			this.tabNavService.tabSubNavBreadcrumbs$,
		]).pipe(
			map(([tabNav, tabSubNav, tabSubNavBreadcrumb]) => [
				tabNav ? tabNav.label : null,
				tabSubNav,
				tabNav,
				tabSubNavBreadcrumb,
			]),
		);

		// Register all health checks for endpoint types that support this
		entityCatalog.getAllEndpointTypes().forEach((epType) => {
			if (epType?.definition?.healthCheck) {
				this.endpointsService.registerHealthCheck(
					epType.definition.healthCheck,
				);
			}
		});

		this.dispatchRelations();
		// Initialize user favorites - fire and forget action, no subscription needed
		stratosEntityCatalog.userFavorite.api.getAll();
	}

	ngOnDestroy() {
		if (this.mobileSub) {
			this.mobileSub.unsubscribe();
		}
		if (this.closeSub) {
			this.closeSub.unsubscribe();
		}
		this.sidePanelService.unsetContainer();
	}

	isNoMarginView(route: ActivatedRouteSnapshot): boolean {
		while (route.firstChild) {
			route = route.firstChild;
			if (route.data.uiNoMargin) {
				return true;
			}
		}
		return false;
	}

	private getNavigationRoutes(): SideNavItem[] {
		let navItems = this.collectNavigationRoutes("", this.router.config);

		// Sort by name
		navItems = navItems.sort((a: SideNavItem, b: SideNavItem) =>
			a.label.localeCompare(b.label),
		);

		// Sort by position
		navItems = navItems.sort((a: SideNavItem, b: SideNavItem) => {
			const posA = a.position ? a.position : 99;
			const posB = b.position ? b.position : 99;
			return posA - posB;
		});

		return navItems;
	}

	private collectNavigationRoutes(
		path: string,
		routes: Route[],
	): SideNavItem[] {
		if (!routes) {
			return [];
		}
		return routes.reduce((nav: SideNavItem[], route: Route) => {
			if (route.data?.stratosNavigation) {
				const item: SideNavItem = {
					...route.data.stratosNavigation,
					link: `${path}/${route.path}`,
				};
				if (item.requiresEndpointType) {
					// Upstream always likes to show Cloud Foundry related endpoints - other distributions can change this behaviour
					const alwaysShow = this.cs.get().alwaysShowNavForEndpointTypes
						? this.cs
								.get()
								.alwaysShowNavForEndpointTypes(item.requiresEndpointType)
						: item.requiresEndpointType === "cf";
					item.hidden = alwaysShow
						? of(false)
						: this.endpointsService.doesNotHaveConnectedEndpointType(
								item.requiresEndpointType,
							);
				} else if (item.requiresPersistence) {
					item.hidden = this.endpointsService.disablePersistenceFeatures$.pipe(
						startWith(true),
					);
				}
				// Backwards compatibility (text became label)
				if (!item.label && !!item.text) {
					item.label = item.text;
				}
				nav.push(item);
			}

			const navs = this.collectNavigationRoutes(route.path, route.children);
			return nav.concat(navs);
		}, []);
	}
}
