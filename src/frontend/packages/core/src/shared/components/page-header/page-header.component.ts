import { TemplatePortal } from '@angular/cdk/portal';
import { AfterViewInit, Component, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { Logout } from '../../../../../store/src/actions/auth.actions';
import { ToggleSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { AddRecentlyVisitedEntityAction } from '../../../../../store/src/actions/recently-visited.actions';
import { AuthState } from '../../../../../store/src/reducers/auth.reducer';
import { selectIsMobile } from '../../../../../store/src/selectors/dashboard.selectors';
import { InternalEventSeverity } from '../../../../../store/src/types/internal-events.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { TabNavService } from '../../../../tab-nav.service';
import { EntityCatalogueHelpers } from '../../../core/entity-catalogue/entity-catalogue.helper';
import { GlobalEventService, IGlobalEvent } from '../../global-events.service';
import { StratosStatus } from '../../shared.types';
import { FavoritesConfigMapper } from '../favorites-meta-card/favorite-config-mapper';
import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnDestroy, AfterViewInit {
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;
  public pFavorite: UserFavorite<IFavoriteMetadata>;
  private pTabs: ISubHeaderTabs[];

  public isMobile$: Observable<boolean> = this.store.select(selectIsMobile);

  @ViewChild('pageHeaderTmpl') pageHeaderTmpl: TemplateRef<any>;

  @Input() hideSideNavButton = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$: Observable<string[]>;

  @Input()
  set tabs(tabs: ISubHeaderTabs[]) {
    if (tabs) {
      this.pTabs = tabs.map(tab => ({
        ...tab,
        link: this.router.createUrlTree([tab.link], {
          relativeTo: this.route
        }).toString()
      }));
      this.tabNavService.setTabs(this.pTabs);
    }
  }

  @Input()
  set tabsHeader(header: string) {
    if (header) {
      this.tabNavService.setHeader(header);
    }
  }


  @Input() showUnderFlow = false;

  private pShowHistory = true;
  @Input()
  get showHistory(): boolean {
    return !this.logoutOnly && this.pShowHistory;
  }
  set showHistory(showHistory: boolean) {
    this.pShowHistory = showHistory;
  }

  public events$: Observable<IGlobalEvent[]>;
  public eventCount$: Observable<number>;
  public eventPriorityStatus$: Observable<StratosStatus>;

  @Input() set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    if (favorite && (!this.pFavorite || (favorite.guid !== this.pFavorite.guid))) {
      this.pFavorite = favorite;
      const mapperFunction = this.favoritesConfigMapper.getMapperFunction(favorite);
      const prettyType = this.favoritesConfigMapper.getPrettyTypeName(favorite);
      const prettyEndpointType = this.favoritesConfigMapper.getPrettyTypeName({
        endpointType: favorite.endpointType,
        entityType: EntityCatalogueHelpers.endpointType
      });
      if (mapperFunction) {
        const { name, routerLink } = mapperFunction(favorite.metadata);
        this.store.dispatch(new AddRecentlyVisitedEntityAction({
          guid: favorite.guid,
          entityType: favorite.entityType,
          endpointType: favorite.endpointType,
          entityId: favorite.entityId,
          name,
          routerLink,
          prettyType,
          endpointId: favorite.endpointId,
          prettyEndpointType: prettyEndpointType === prettyType ? null : prettyEndpointType
        }));
      }
    }
  }

  public userNameFirstLetter$: Observable<string>;
  public username$: Observable<string>;
  public actionsKey: string;

  @Input()
  set breadcrumbs(breadcrumbs: IHeaderBreadcrumb[]) {
    this.breadcrumbDefinitions = this.getBreadcrumb(breadcrumbs);
  }

  // Used when non-admin logs in with no-endpoints -> only show logout in the menu
  @Input() logoutOnly: boolean;

  private getBreadcrumb(breadcrumbs: IHeaderBreadcrumb[]) {
    if (!breadcrumbs || !breadcrumbs.length) {
      return [];
    }
    return this.getBreadcrumbFromKey(breadcrumbs).breadcrumbs;
  }

  private getBreadcrumbFromKey(breadcrumbs: IHeaderBreadcrumb[]) {
    if (breadcrumbs.length === 1 || !this.breadcrumbKey) {
      return breadcrumbs[0];
    }
    return breadcrumbs.find(breadcrumb => {
      return breadcrumb.key === this.breadcrumbKey;
    }) || breadcrumbs[0];
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  public toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  constructor(
    private store: Store<CFAppState>,
    private route: ActivatedRoute,
    private tabNavService: TabNavService,
    private router: Router,
    eventService: GlobalEventService,
    private favoritesConfigMapper: FavoritesConfigMapper
  ) {
    this.eventCount$ = eventService.events$.pipe(
      map(events => events.length)
    );
    this.eventPriorityStatus$ = eventService.priorityStratosStatus$;

    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;
    this.username$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth && auth.sessionData ? auth.sessionData.user.name : 'Unknown')
    );
    this.userNameFirstLetter$ = this.username$.pipe(
      map(name => name[0].toLocaleUpperCase())
    );
  }

  ngOnDestroy() {
    this.tabNavService.clear();
  }

  ngAfterViewInit() {
    const portal = new TemplatePortal(this.pageHeaderTmpl, undefined, {});
    this.tabNavService.setPageHeader(portal);
  }

}
