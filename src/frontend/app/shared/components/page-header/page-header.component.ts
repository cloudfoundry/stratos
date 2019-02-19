import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserFavorite, IFavoriteMetadata } from './../../../store/types/user-favorites.types';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logout } from '../../../store/actions/auth.actions';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { InternalEventSeverity } from '../../../store/types/internal-events.types';
import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';
import { ToggleSideNav } from './../../../store/actions/dashboard-actions';
import { AppState } from './../../../store/app-state';
import { TabNavService } from '../../../tab-nav.service';
import { AddRecentlyVisitedEntityAction } from '../../../store/actions/recently-visited.actions';
import { favoritesConfigMapper } from '../favorites-meta-card/favorite-config-mapper';
import { IBreadcrumb } from '../breadcrumbs/breadcrumbs.types';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit, OnDestroy {

  public eventSeverity = InternalEventSeverity;
  public _favorite: UserFavorite<IFavoriteMetadata>;

  @Input() hideSideNavButton = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$: Observable<string[]>;
  activeTab$: Observable<string>;

  @Input()
  set tabs(tabs: ISubHeaderTabs[]) {
    if (tabs) {
      this._tabs = tabs.map(tab => ({
        ...tab,
        link: this.router.createUrlTree([tab.link], {
          relativeTo: this.route
        }).toString()
      }));
      this.tabNavService.setTabs(this._tabs);
    }
  }

  @Input()
  set tabsHeader(header: string) {
    if (header) {
      this.tabNavService.setHeader(header);
    }
  }

  private _tabs: ISubHeaderTabs[];

  @Input() showUnderFlow = false;

  @Input() showHistory = true;

  @Input() set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    if (favorite && (!this._favorite || (favorite.guid !== this._favorite.guid))) {
      this._favorite = favorite;
      const mapperFunction = favoritesConfigMapper.getMapperFunction(favorite);
      const prettyType = favoritesConfigMapper.getPrettyTypeName(favorite);
      const prettyEndpointType = favoritesConfigMapper.getPrettyTypeName({
        endpointType: favorite.endpointType,
        entityType: 'endpoint'
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
  public actionsKey: String;

  // Used when non-admin logs in with no-endpoints -> only show logout in the menu
  @Input() logoutOnly: boolean;

  @Input()
  set breadcrumbs(breadcrumbs: IBreadcrumb[]) {
    this.tabNavService.setBreadcrumbs(breadcrumbs);
  }

  toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private tabNavService: TabNavService,
  ) {
    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    this.username$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth && auth.sessionData ? auth.sessionData.user.name : 'Unknown')
    );
    this.userNameFirstLetter$ = this.username$.pipe(
      map(name => name[0].toLocaleUpperCase())
    );
  }

  ngOnInit() {
    this.activeTab$ = this.tabNavService.getCurrentTabHeaderObservable(this._tabs);
  }

  ngOnDestroy() {
    this.tabNavService.clear();
  }

}
