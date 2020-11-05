import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EntityCatalogSchemas,
  HomeCardShortcut,
  IStratosEndpointDefinition,
} from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { FavoritesConfigMapper } from '../../../../../../store/src/favorite-config-mapper';
import { EndpointModel, entityCatalog } from '../../../../../../store/src/public-api';
import { UserFavoriteManager } from '../../../../../../store/src/user-favorite-manager';
import { UserFavoriteEndpoint } from './../../../../../../store/src/types/user-favorites.types';
import { HomePageCardLayout, LinkMetadata } from './../../home.types';

const MAX_FAVS = 5;
const MAX_SHORTCUTS = 5;
const MAX_LINKS = 5;

@Component({
  selector: 'app-home-page-endpoint-card',
  templateUrl: './home-page-endpoint-card.component.html',
  styleUrls: ['./home-page-endpoint-card.component.scss']
})
export class HomePageEndpointCardComponent implements OnInit {

  @Input() endpoint: EndpointModel;

  _layout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this._layout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this._layout = value;
    }
    this.updateLayout();
  };

  @Output() loaded = new EventEmitter<HomePageEndpointCardComponent>();

  favorites$: Observable<any>;

  shortcuts: HomeCardShortcut[];

  layout$ = new BehaviorSubject<HomePageCardLayout>(null);

  links$: Observable<LinkMetadata>;

  entity; StratosCatalogEndpointEntity;

  definition: IStratosEndpointDefinition<EntityCatalogSchemas>;

  favorite: UserFavoriteEndpoint;

  public link: string;

  load$: Observable<boolean>;
  loadSubj = new BehaviorSubject<boolean>(false);
  isLoading = false;

  // Should the Home Card use the whole width, or do we show the links panel as well?
  fullView = false;

  constructor(
    private favoritesConfigMapper: FavoritesConfigMapper,
    private userFavoriteManager: UserFavoriteManager,
  ) {
    this.load$ = this.loadSubj.asObservable();
  }

  ngOnInit(): void {
    // Favorites for this endpoint
    this.favorites$ = this.userFavoriteManager.getFavoritesForEndpoint(this.endpoint.guid).pipe(
      map(f => {
        return f.map(item => this.userFavoriteManager.mapToHydrated(item));
      })
    );

    this.entity = entityCatalog.getEndpoint(this.endpoint.cnsi_type, this.endpoint.sub_type)
    this.definition = this.entity.definition;
    this.favorite = this.favoritesConfigMapper.getFavoriteEndpointFromEntity(this.endpoint);

    // Get the list of shortcuts for the endpoint for the given endpoint ID
    if (this.definition.homeCard && this.definition.homeCard.shortcuts) {
      this.shortcuts = this.definition.homeCard.shortcuts(this.endpoint.guid);
    }

    this.fullView = this.definition.homeCard && this.definition.homeCard.fullView;

    const mapper = this.favoritesConfigMapper.getMapperFunction(this.favorite);
    if (mapper && this.favorite.metadata) {
      const p = mapper(this.favorite.metadata);
      if (p) {
        this.link = p.routerLink;
      }
    }

    this.links$ = combineLatest([this.favorites$, this.layout$.asObservable()]).pipe(
      map(([favs, layout]) => {
        let shortcuts: HomeCardShortcut[] = this.shortcuts || [];
        const totalShortcuts = shortcuts.length;
        // Based on the layout, adjust the numbers returned
        if (layout.y > 1) {
          if (favs.length > MAX_FAVS) {
            favs = favs.slice(0, MAX_FAVS);
          }
          if (totalShortcuts > MAX_SHORTCUTS) {
            shortcuts = this.shortcuts.slice(0, MAX_SHORTCUTS);
          }
          // We only want to display 5 things
          if (favs.length + totalShortcuts > MAX_LINKS) {
            let limit = MAX_LINKS - favs.length;
            if (limit === 1) {
              limit = 0;
            }
            shortcuts = this.shortcuts.slice(0, limit);
          }
        }
        return {
          favs,
          shortcuts
        };
      })
    );
  }

  public load() {
    this.loadSubj.next(true);
    this.isLoading = true;
  }

  public cardLoaded() {
    this.loaded.next(this);
    this.isLoading = false;
  }

  public updateLayout() {
    this.layout$.next(this.layout);
  }
}
