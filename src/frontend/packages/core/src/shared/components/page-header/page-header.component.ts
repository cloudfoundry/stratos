import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Logout } from '../../../../../store/src/actions/auth.actions';
import { ToggleSideNav } from '../../../../../store/src/actions/dashboard-actions';
import { AddRecentlyVisitedEntityAction } from '../../../../../store/src/actions/recently-visited.actions';
import { AppState } from '../../../../../store/src/app-state';
import { AuthState } from '../../../../../store/src/reducers/auth.reducer';
import { InternalEventSeverity } from '../../../../../store/src/types/internal-events.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { favoritesConfigMapper } from '../favorites-meta-card/favorite-config-mapper';
import { ISubHeaderTabs } from '../page-subheader/page-subheader.types';
import { BREADCRUMB_URL_PARAM, IHeaderBreadcrumb, IHeaderBreadcrumbLink } from './page-header.types';
import { GlobalEventService, IGlobalEvent, GlobalEventTypes } from '../../global-events.service';
import { StratosStatus } from '../../shared.types';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  public breadcrumbDefinitions: IHeaderBreadcrumbLink[] = null;
  private breadcrumbKey: string;
  public eventSeverity = InternalEventSeverity;
  public pFavorite: UserFavorite<IFavoriteMetadata>;

  @Input() hideSideNavButton = false;

  @Input() hideMenu = false;

  @Input()
  endpointIds$: Observable<string[]>;

  @Input()
  tabs: ISubHeaderTabs[];

  @Input() showUnderFlow = false;

  @Input() showHistory = true;

  public events$: Observable<IGlobalEvent[]>;
  public eventCount$: Observable<number>;
  public eventPriorityStatus$: Observable<StratosStatus>;

  @Input() set favorite(favorite: UserFavorite<IFavoriteMetadata>) {
    if (favorite && (!this.pFavorite || (favorite.guid !== this.pFavorite.guid))) {
      this.pFavorite = favorite;
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

  toggleSidenav() {
    this.store.dispatch(new ToggleSideNav());
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    eventService: GlobalEventService
  ) {
    this.events$ = eventService.events$;
    this.eventCount$ = eventService.events$.pipe(
      map(events => events.length)
    );
    this.eventPriorityStatus$ = eventService.priorityType$.pipe(
      map(priorityEventType => {
        console.log(priorityEventType);
        switch (priorityEventType) {
          case ('warning'):
            return StratosStatus.WARNING;
          case ('process'):
            return StratosStatus.BUSY;
          case ('error'):
            return StratosStatus.ERROR;
          default:
            return null;
        }
      })
    );

    this.actionsKey = this.route.snapshot.data ? this.route.snapshot.data.extensionsActionsKey : null;
    this.breadcrumbKey = route.snapshot.queryParams[BREADCRUMB_URL_PARAM] || null;
    this.username$ = store.select(s => s.auth).pipe(
      map((auth: AuthState) => auth && auth.sessionData ? auth.sessionData.user.name : 'Unknown')
    );
    this.userNameFirstLetter$ = this.username$.pipe(
      map(name => name[0].toLocaleUpperCase())
    );
  }

}
