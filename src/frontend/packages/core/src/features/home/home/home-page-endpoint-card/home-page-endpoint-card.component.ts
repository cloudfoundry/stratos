import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterViewInit, Component, ComponentRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewContainerRef, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { take, filter, map, timeout } from 'rxjs/operators';

import {
  EntityCatalogSchemas,
  IStratosEndpointDefinition } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from '../../../../../../store/src/public-api';
import { UserFavoriteManager } from '../../../../../../store/src/user-favorite-manager';
import { EntityFavoriteStarComponent } from '../../../../core/entity-favorite-star/entity-favorite-star.component';
import { MultilineTitleComponent } from '../../../../shared/components/multiline-title/multiline-title.component';
import { SidePanelMode, SidePanelService } from '../../../../shared/services/side-panel.service';
import { FavoritesSidePanelComponent } from '../favorites-side-panel/favorites-side-panel.component';
import { FavoritesMetaCardComponent } from '../favorites-meta-card/favorites-meta-card.component';
import { HomeShortcutsComponent } from '../home-shortcuts/home-shortcuts.component';
import { UserFavoriteEndpoint } from './../../../../../../store/src/types/user-favorites.types';
import { HomePageCardLayout, HomePageEndpointCard, LinkMetadata } from './../../home.types';
import {
  DefaultEndpointHomeComponent } from './../default-endpoint-home-component/default-endpoint-home-component.component';

const MAX_FAVS_NORMAL = 15;
const MAX_FAVS_COMPACT = 5;
const CUTOFF_SHOW_SHORTCUTS_ON_LEFT = 10;
const MAX_SHORTCUTS = 5;
const MAX_LINKS = 5;

// Loading/error status of the card
enum Status {
  OK = 0,
  Loading = 1,
  Error = 2 }

@Component({
  selector: 'app-home-page-endpoint-card',
  templateUrl: './home-page-endpoint-card.component.html',
  styleUrls: ['./home-page-endpoint-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MultilineTitleComponent,
    EntityFavoriteStarComponent,
    HomeShortcutsComponent,
    FavoritesMetaCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageEndpointCardComponent implements OnInit, OnDestroy, AfterViewInit {
  private userFavoriteManager = inject(UserFavoriteManager);
  private sidePanelService = inject(SidePanelService);




  @ViewChild('customCard', { read: ViewContainerRef, static: true }) customCard!: ViewContainerRef;

  @Input() endpoint!: EndpointModel;

  pLayout: HomePageCardLayout;

  get layout(): HomePageCardLayout {
    return this.pLayout;
  }

  // Raw grid layout before columnSpan adjustment
  private rawLayout: HomePageCardLayout;

  @Input() set layout(value: HomePageCardLayout) {
    if (value) {
      this.rawLayout = value;
      this.computeEffectiveLayout();
    }
    this.updateLayout();
  }

  @Output() loaded = new EventEmitter<HomePageEndpointCardComponent>();

  favorites$: Observable<any>;

  private _layout = signal<HomePageCardLayout>(null);
  public layoutSignal = this._layout.asReadonly();
  public layout$: Observable<HomePageCardLayout>;

  links$: Observable<LinkMetadata>;

  entity: any;

  definition: IStratosEndpointDefinition<EntityCatalogSchemas>;

  favorite: UserFavoriteEndpoint;

  public link!: string;

  // Status = 0 OK, 1 Loading, 2 Error
  private _status = signal<Status>(Status.OK);
  public statusSignal = this._status.asReadonly();
  public status$: Observable<Status>;

  private ref: ComponentRef<HomePageEndpointCard>;
  private sub!: Subscription;

  private canLoad = false;

  // Should we show shortcuts on the side or udner the manin panel?
  showShortcutsOnSide = true;
  hiddenFavorites = 0;

  // Should the Home Card use the whole width, or do we show the links panel as well?
  fullView = false;

  // Does the endpoint haev entities that can be favourited
  // If not, then don't show favorites, as there can never be any
  hasFavEntities = false;

  constructor() {
    this.layout$ = toObservable(this._layout);
    this.status$ = toObservable(this._status);
  }

  ngAfterViewInit() {
    // Dynamically load the component for the Home Card for this endopoint
    const endpointEntity = entityCatalog.getEndpoint(this.endpoint.cnsi_type, this.endpoint.sub_type);
    if (endpointEntity && endpointEntity.definition.homeCard && endpointEntity.definition.homeCard.component) {
      this.createCard(endpointEntity);
    } else {
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
      // Recompute effective layout now that definition is available
      this.computeEffectiveLayout();
      this.updateLayout();
    }

    this.links$ = combineLatest([this.favorites$, this.layout$]).pipe(
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

  private computeEffectiveLayout() {
    if (this.rawLayout) {
      const span = this.definition?.homeCard?.columnSpan || 1;
      const effectiveX = Math.max(1, this.rawLayout.x - span + 1);
      this.pLayout = new HomePageCardLayout(effectiveX, this.rawLayout.y);
    }
  }

  // Layout has changed
  public updateLayout() {
    this._layout.set(this.pLayout);
    if (this.ref && this.ref.instance) {
      this.ref.instance.layout = this.pLayout;
    }
  }

  async createCard(endpointEntity: any) {
    this.customCard.clear();

    let component: any;
    if (!endpointEntity) {
      component = DefaultEndpointHomeComponent;
    } else {
      component = await endpointEntity.definition.homeCard.component();
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
      this._status.set(Status.Loading);
      const loadObs = this.ref.instance.load() || of(true);

      // Timeout after 60 seconds (increased from 15 to allow for slow API responses)
      // CF home cards need to fetch apps, orgs, routes which can take time on large deployments
      this.sub = loadObs.pipe(
        timeout(60000),
        filter((v: boolean) => v === true),
        take(1)
      ).subscribe({
        next: () => {
          this._status.set(Status.OK);
          this.loaded.next(void 0);
        },
        error: () => {
          this.loaded.next(void 0);
          this._status.set(Status.Error);
          this.sub.unsubscribe();
        }
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
