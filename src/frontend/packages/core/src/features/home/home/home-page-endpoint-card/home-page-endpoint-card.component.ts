import {
  AfterViewInit,
  Compiler,
  Component,
  ComponentRef,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { filter, first, map, timeout } from 'rxjs/operators';

import {
  EntityCatalogSchemas,
  HomeCardShortcut,
  IStratosEndpointDefinition,
} from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { FavoritesConfigMapper } from '../../../../../../store/src/favorite-config-mapper';
import { EndpointModel, entityCatalog } from '../../../../../../store/src/public-api';
import { UserFavoriteManager } from '../../../../../../store/src/user-favorite-manager';
import { SidePanelMode, SidePanelService } from '../../../../shared/services/side-panel.service';
import { FavoritesSidePanelComponent } from '../favorites-side-panel/favorites-side-panel.component';
import { UserFavoriteEndpoint } from './../../../../../../store/src/types/user-favorites.types';
import { HomePageCardLayout, HomePageEndpointCard, LinkMetadata } from './../../home.types';

const MAX_FAVS_NORMAL = 15;
const MAX_FAVS_COMPACT = 5;
const CUTOFF_SHOW_SHORTCUTS_ON_LEFT = 10;
const MAX_SHORTCUTS = 5;
const MAX_LINKS = 5;

@Component({
  selector: 'app-home-page-endpoint-card',
  templateUrl: './home-page-endpoint-card.component.html',
  styleUrls: ['./home-page-endpoint-card.component.scss']
})
export class HomePageEndpointCardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('customCard', {read:ViewContainerRef}) customCard: ViewContainerRef;

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
  isError = false;

  private ref: ComponentRef<HomePageEndpointCard>;
  private sub: Subscription;

  private canLoad = false;

  // Should we show shortcuts on the side or udner the manin panel?
  showShortcutsOnSide = true;
  hiddenFavorites = 0;

  // Should the Home Card use the whole width, or do we show the links panel as well?
  fullView = false;

  constructor(
    private favoritesConfigMapper: FavoritesConfigMapper,
    private userFavoriteManager: UserFavoriteManager,
    private sidePanelService: SidePanelService,
    private compiler: Compiler,
    private injector: Injector,
  ) {
    this.load$ = this.loadSubj.asObservable();
  }

  ngAfterViewInit() {
    // Dynamically load the component for the Home Card for this endopoint
    const endpointEntity = entityCatalog.getEndpoint(this.endpoint.cnsi_type, this.endpoint.sub_type)
    if (endpointEntity.definition.homeCard && endpointEntity.definition.homeCard.component) {
      this.createCard(endpointEntity);
    } else {
      console.warn(`No endpoint home card for ${this.endpoint.guid}`);
    }
  }

  ngOnInit() {
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

        const max = (layout.y > 1) ? MAX_FAVS_COMPACT : MAX_FAVS_NORMAL;
        const totalShortcuts = shortcuts.length;
        this.hiddenFavorites = favs.length - max;

        // Based on the layout, adjust the numbers returned
        if (layout.y > 1) {
          // Compact card view
          this.showShortcutsOnSide = true;
          if (favs.length > max) {
            favs = favs.slice(0, max);
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
        } else {
          // Full card view - move the shortcuts into the main left panel if we have more
          // than a certain number of favorites to also show
          if (favs.length >= CUTOFF_SHOW_SHORTCUTS_ON_LEFT) {
            this.showShortcutsOnSide = false;
          }
        }
        return {
          favs,
          shortcuts
        };
      })
    );
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.destroy();
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  // Layout has changed
  public updateLayout() {
    this.layout$.next(this.layout);

    if (this.ref && this.ref.instance) {
      (this.ref.instance as any).layout = this._layout;
    }
  }

  async createCard(endpointEntity: any) {
    this.customCard.clear();
    const component = await endpointEntity.definition.homeCard.component(this.compiler, this.injector);
    this.ref = this.customCard.createComponent(component);
    (this.ref.instance as any).endpoint = this.endpoint;
    (this.ref.instance as any).layout = this._layout;
    this.loadCard();
  }

  // Load the card
  public load() {
    this.canLoad = true;
    this.loadCard();
  }

  // Ask the card to load itself
  loadCard() {
    if (this.canLoad && this.ref && this.ref.instance && this.ref.instance.load) {
      this.isLoading = true;
      const loadObs = this.ref.instance.load() || of(true);

      // Timeout after 10 seconds
      this.sub = loadObs.pipe(timeout(10000), filter(v => v === true), first()).subscribe(() => {
        this.loaded.next();
        this.isLoading = false;
      }, () => {
        this.loaded.next();
        this.isLoading = false;
        this.isError = true;
      });
    }
  }

  public showFavoritesPanel() {
    this.sidePanelService.showMode(SidePanelMode.Narrow, FavoritesSidePanelComponent, {
      endpoint: this.endpoint,
      favorites$: this.favorites$
    });
  }
}
