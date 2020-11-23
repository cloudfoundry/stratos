import {
  AfterViewInit,
  Compiler,
  Component,
  ComponentFactoryResolver,
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
  IStratosEndpointDefinition,
} from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from '../../../../../../store/src/public-api';
import { UserFavoriteManager } from '../../../../../../store/src/user-favorite-manager';
import { SidePanelMode, SidePanelService } from '../../../../shared/services/side-panel.service';
import { FavoritesSidePanelComponent } from '../favorites-side-panel/favorites-side-panel.component';
import { UserFavoriteEndpoint } from './../../../../../../store/src/types/user-favorites.types';
import { HomePageCardLayout, HomePageEndpointCard, LinkMetadata } from './../../home.types';
import {
  DefaultEndpointHomeComponent,
} from './../default-endpoint-home-component/default-endpoint-home-component.component';

const MAX_FAVS_NORMAL = 15;
const MAX_FAVS_COMPACT = 5;
const CUTOFF_SHOW_SHORTCUTS_ON_LEFT = 10;
const MAX_SHORTCUTS = 5;
const MAX_LINKS = 5;

// Loading/error status of the card
enum Status {
  OK = 0,
  Loading = 1,
  Error = 2,
}

@Component({
  selector: 'app-home-page-endpoint-card',
  templateUrl: './home-page-endpoint-card.component.html',
  styleUrls: ['./home-page-endpoint-card.component.scss']
})
export class HomePageEndpointCardComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('customCard', {read: ViewContainerRef}) customCard: ViewContainerRef;

  @Input() endpoint: EndpointModel;

  pLayout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this.pLayout;
  }

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this.pLayout = value;
    }
    this.updateLayout();
  }

  @Output() loaded = new EventEmitter<HomePageEndpointCardComponent>();

  favorites$: Observable<any>;

  layout$ = new BehaviorSubject<HomePageCardLayout>(null);

  links$: Observable<LinkMetadata>;

  entity; StratosCatalogEndpointEntity;

  definition: IStratosEndpointDefinition<EntityCatalogSchemas>;

  favorite: UserFavoriteEndpoint;

  public link: string;

  // Status = 0 OK, 1 Loading, 2 Error
  status$: Observable<Status>;
  status = new BehaviorSubject<Status>(Status.OK);

  private ref: ComponentRef<HomePageEndpointCard>;
  private sub: Subscription;

  private canLoad = false;

  // Should we show shortcuts on the side or udner the manin panel?
  showShortcutsOnSide = true;
  hiddenFavorites = 0;

  // Should the Home Card use the whole width, or do we show the links panel as well?
  fullView = false;

  // Does the endpoint haev entities that can be favourited
  // If not, then don't show favorites, as there can never be any
  hasFavEntities = false;

  constructor(
    private userFavoriteManager: UserFavoriteManager,
    private sidePanelService: SidePanelService,
    private compiler: Compiler,
    private injector: Injector,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {
    this.status$ = this.status.asObservable();
  }

  ngAfterViewInit() {
    // Dynamically load the component for the Home Card for this endopoint
    const endpointEntity = entityCatalog.getEndpoint(this.endpoint.cnsi_type, this.endpoint.sub_type);
    if (endpointEntity && endpointEntity.definition.homeCard && endpointEntity.definition.homeCard.component) {
      this.createCard(endpointEntity);
    } else {
      console.warn(`No endpoint home card for ${this.endpoint.guid}`);
      this.createCard(undefined);
    }
  }

  ngOnInit() {
    this.hasFavEntities = this.userFavoriteManager.endpointHasEntitiesThatCanFavorite(this.endpoint.cnsi_type);
    // Favorites for this endpoint
    this.favorites$ = this.userFavoriteManager.getFavoritesForEndpoint(this.endpoint.guid);
    this.entity = entityCatalog.getEndpoint(this.endpoint.cnsi_type, this.endpoint.sub_type);
    if (this.entity) {
      this.definition = this.entity.definition;
      this.favorite = this.userFavoriteManager.getFavoriteEndpointFromEntity(this.endpoint);
      this.fullView = this.definition?.homeCard?.fullView;
      this.link = this.favorite.getLink();
    }

    this.links$ = combineLatest([this.favorites$, this.layout$.asObservable()]).pipe(
      filter(([favs, layout]) => !!layout),
      map(([favs, layout]) => {
        // Get the list of shortcuts for the endpoint for the given endpoint ID
        const shortcutsFn = this.definition?.homeCard?.shortcuts;
        const allShortcuts = shortcutsFn ? shortcutsFn(this.endpoint.guid) || [] : [];
        let shortcuts = allShortcuts;
        const max = (layout.y > 1) ? MAX_FAVS_COMPACT : MAX_FAVS_NORMAL;
        const totalShortcuts = allShortcuts.length;
        this.hiddenFavorites = favs.length - max;

        // Based on the layout, adjust the numbers returned
        if (layout.y > 1) {
          // Compact card view
          this.showShortcutsOnSide = true;
          if (favs.length > max) {
            favs = favs.slice(0, max);
          }
          if (totalShortcuts > MAX_SHORTCUTS) {
            shortcuts = allShortcuts.slice(0, MAX_SHORTCUTS);
          }
          // We only want to display 5 things
          if (favs.length + totalShortcuts > MAX_LINKS) {
            let limit = MAX_LINKS - favs.length;
            if (limit === 1) {
              limit = 0;
            }
            shortcuts = allShortcuts.slice(0, limit);
          }
        } else {
          // Full card view - move the shortcuts into the main left panel if we have more
          // than a certain number of favorites to also show
          if (favs.length >= CUTOFF_SHOW_SHORTCUTS_ON_LEFT) {
            this.showShortcutsOnSide = false;
          }
        }

        // If nothing can be favorited and there are no shotrcuts then hide the right-hand side panel
        if (!this.hasFavEntities && shortcuts.length === 0) {
          setTimeout(() => this.fullView = true, 0);
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
      this.ref.instance.layout = this.pLayout;
    }
  }

  async createCard(endpointEntity: any) {
    this.customCard.clear();

    let component;
    if (!endpointEntity) {
      component = this.componentFactoryResolver.resolveComponentFactory(DefaultEndpointHomeComponent);
    } else {
      component = await endpointEntity.definition.homeCard.component(this.compiler, this.injector);
    }

    this.ref = this.customCard.createComponent(component);
    this.ref.instance.endpoint = this.endpoint;
    this.ref.instance.layout = this.pLayout;
    this.loadCardIfReady();
  }

  // Load the card
  public load() {
    this.canLoad = true;
    this.loadCardIfReady();
  }

  // Ask the card to load itself
  loadCardIfReady() {
    if (this.canLoad && this.ref && this.ref.instance && this.ref.instance.load) {
      this.status.next(Status.Loading);
      const loadObs = this.ref.instance.load() || of(true);

      // Timeout after 15 seconds
      this.sub = loadObs.pipe(timeout(15000), filter(v => v === true), first()).subscribe(() => {
        this.loaded.next();
        setTimeout(() => this.status.next(Status.OK), 0);
      }, () => {
        this.loaded.next();
        this.status.next(Status.Error);
        this.sub.unsubscribe();
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
