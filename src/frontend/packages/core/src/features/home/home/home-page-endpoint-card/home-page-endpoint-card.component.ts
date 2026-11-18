import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterViewInit, Component, ComponentRef, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewContainerRef, Signal, computed, effect, signal, inject, output, input, untracked, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { take, filter, timeout } from 'rxjs/operators';

import {
  EntityCatalogSchemas,
  IStratosEndpointDefinition } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel, entityCatalog } from '../../../../../../store/src/public-api';
import { UserFavoriteManager } from '../../../../../../store/src/user-favorite-manager';
import { EntityFavoriteStarComponent } from '../../../../core/entity-favorite-star/entity-favorite-star.component';
import { CustomIconComponent } from '../../../../shared/components/custom-material/custom-material.component';
import { CustomTooltipDirective } from '../../../../shared/components/custom-tooltip/custom-tooltip.directive';
import { MultilineTitleComponent } from '../../../../shared/components/multiline-title/multiline-title.component';
import { SidePanelMode, SidePanelService } from '../../../../shared/services/side-panel.service';
import { TailwindDialogService } from '../../../../shared/services/tailwind-dialog.service';
import { CONNECT_ENDPOINT_DIALOG_OPTIONS, ConnectEndpointDialogComponent } from '../../../endpoints/connect-endpoint-dialog/connect-endpoint-dialog.component';
import { isEndpointConnected } from '../../../endpoints/endpoint-helpers';
import { FavoritesSidePanelComponent } from '../favorites-side-panel/favorites-side-panel.component';
import { FavoritesMetaCardComponent } from '../favorites-meta-card/favorites-meta-card.component';
import { HomeShortcutsComponent } from '../home-shortcuts/home-shortcuts.component';
import { IFavoriteMetadata, UserFavorite, UserFavoriteEndpoint } from './../../../../../../store/src/types/user-favorites.types';
import { HomePageCardLayout, HomePageEndpointCard, LinkMetadata } from './../../home.types';
import {
  DefaultEndpointHomeComponent } from './../default-endpoint-home-component/default-endpoint-home-component.component';
import { AppBusyComponent } from '../../../../shared/components/busy-indicator/busy-indicator.component';

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
    AppBusyComponent,
    CustomTooltipDirective,
    CommonModule,
    RouterModule,
    MultilineTitleComponent,
    EntityFavoriteStarComponent,
    HomeShortcutsComponent,
    FavoritesMetaCardComponent,
    CustomIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageEndpointCardComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private userFavoriteManager = inject(UserFavoriteManager);
  private sidePanelService = inject(SidePanelService);
  private dialog = inject(TailwindDialogService);




  readonly customCard = viewChild.required('customCard', { read: ViewContainerRef });

  readonly endpoint = input.required<EndpointModel>();

  // The grid layout the home page sets, before the columnSpan adjustment.
  // Null until the parent's persisted layout hydrates. The layout this card
  // uses, and hands to the card it creates, is `layoutSignal`.
  readonly layout = input<HomePageCardLayout | null>();

  // strict: assigned by computeEffectiveLayout once a layout is set
  pLayout!: HomePageCardLayout;

  // Last non-null value of `layout`
  // strict: assigned by the layout effect; reads are guarded with if (this.rawLayout)
  private rawLayout!: HomePageCardLayout;

  readonly loaded = output<void>();

  // strict: assigned in ngOnInit before the template reads it; undefined
  // until the favorites have loaded
  favorites!: Signal<UserFavorite<IFavoriteMetadata>[] | undefined>;

  private _layout = signal<HomePageCardLayout | null>(null);
  public layoutSignal = this._layout.asReadonly();

  // The favorites and shortcuts to list, once the favorites have loaded and
  // a layout is set. How many fit depends on the layout.
  readonly links = computed<LinkMetadata | null>(() => {
    const layout = this.layoutSignal();
    const allFavs = this.favorites?.();
    if (!layout || !allFavs) {
      return null;
    }
    // Get the list of shortcuts for the endpoint for the given endpoint ID
    const shortcutsFn = this.definition?.homeCard?.shortcuts;
    // strict: guid is populated on every bound endpoint; '' default keeps the lookup well-formed
    const allShortcuts = shortcutsFn ? shortcutsFn(this.endpoint().guid ?? '') || [] : [];
    let favs = allFavs;
    let shortcuts = allShortcuts;
    const totalShortcuts = allShortcuts.length;

    // Based on the layout, adjust the numbers returned
    if (layout.y > 1) {
      // Compact card view
      if (favs.length > MAX_FAVS_COMPACT) {
        favs = favs.slice(0, MAX_FAVS_COMPACT);
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
    }
    return { favs, shortcuts };
  });

  // Favorites that do not fit in the card
  readonly hiddenFavorites = computed(() => {
    const layout = this.layoutSignal();
    const favs = this.favorites?.();
    return layout && favs ? favs.length - (layout.y > 1 ? MAX_FAVS_COMPACT : MAX_FAVS_NORMAL) : 0;
  });

  // Should we show shortcuts on the side or under the main panel? On the side
  // unless the card is full view with many favorites to also show.
  readonly showShortcutsOnSide = computed(() => {
    const layout = this.layoutSignal();
    return !layout || layout.y > 1 || (this.favorites?.()?.length ?? 0) < CUTOFF_SHOW_SHORTCUTS_ON_LEFT;
  });

  entity: any;

  // strict: assigned in ngOnInit when the endpoint entity resolves; template gates on it via @if (definition)
  definition!: IStratosEndpointDefinition<EntityCatalogSchemas>;

  // getFavoriteEndpointFromEntity returns null when the endpoint has no cnsi_type/guid
  favorite: UserFavoriteEndpoint | null = null;

  public link: string | null = null;

  // Status = 0 OK, 1 Loading, 2 Error
  private _status = signal<Status>(Status.OK);
  public statusSignal = this._status.asReadonly();
  // Expose the Status enum so the template can name values instead of magic numbers
  public readonly Status = Status;

  // strict: assigned by createCard (ngAfterViewInit) before any card-instance read; reads are guarded with if (this.ref)
  private ref!: ComponentRef<HomePageEndpointCard>;
  private sub!: Subscription;

  private canLoad = false;

  // The endpoint type asks for the whole width.
  private readonly definitionFullView = signal(false);

  // Should the Home Card use the whole width, or do we show the links panel as well?
  // It does when the type asks, or when nothing can be favorited and there
  // are no shortcuts, so the right-hand panel would be empty.
  readonly fullView = computed(() => {
    if (this.definitionFullView()) {
      return true;
    }
    const links = this.links();
    return !!links && !this.hasFavEntities && links.shortcuts.length === 0;
  });

  // Favorites/Shortcuts placement: strip below the content (linksBelow) or
  // the classic right-hand sidebar. Per-endpoint via homeCard.linksBelow.
  linksBelow = false;

  // Does the endpoint haev entities that can be favourited
  // If not, then don't show favorites, as there can never be any
  hasFavEntities = false;

  constructor() {
    // An effect: a layout change is also pushed into the created card.
    effect(() => {
      const value = this.layout();
      untracked(() => {
        if (value) {
          this.rawLayout = value;
          this.computeEffectiveLayout();
        }
        this.updateLayout();
      });
    });
  }

  // Disconnected (or token-expired) endpoints render a Disconnected panel with
  // a connect affordance instead of loading their home card — no half-loaded
  // or error card (#5588). unConnectable types (git etc.) are always "up".
  get disconnected(): boolean {
    return !this.definition?.unConnectable && !isEndpointConnected(this.endpoint());
  }

  ngAfterViewInit() {
    this.initCard();
  }

  // Set synchronously when card creation starts — `ref` is only assigned
  // after createCard's async import resolves, so guarding on it alone lets a
  // second initCard sneak in mid-import and append a duplicate card.
  private cardCreated = false;

  ngOnChanges(changes: SimpleChanges) {
    // Endpoint connected while the card is on screen (e.g. via the Connect
    // button below): create and load the real home card now.
    if (changes['endpoint'] && !this.cardCreated && !this.disconnected) {
      this.initCard();
    }
  }

  private initCard() {
    // customCard resolves in ngOnInit; the ngOnChanges path can fire earlier
    if (this.cardCreated || this.disconnected || !this.customCard()) {
      return;
    }
    this.cardCreated = true;
    // Dynamically load the component for the Home Card for this endopoint
    // strict: cnsi_type is populated on every bound endpoint; '' default keeps the lookup well-formed
    const endpointEntity = entityCatalog.getEndpoint(this.endpoint().cnsi_type ?? '', this.endpoint().sub_type);
    if (endpointEntity && endpointEntity.definition.homeCard && endpointEntity.definition.homeCard.component) {
      this.createCard(endpointEntity);
    } else {
      this.createCard(undefined);
    }
  }

  public connect() {
    // Same invocation contract as the endpoints page list
    this.dialog.open(ConnectEndpointDialogComponent, {
      data: {
        name: this.endpoint().name,
        guid: this.endpoint().guid,
        type: this.endpoint().cnsi_type,
        subType: this.endpoint().sub_type,
        ssoAllowed: this.endpoint().sso_allowed,
      },
      ...CONNECT_ENDPOINT_DIALOG_OPTIONS,
    });
  }

  ngOnInit() {
    // strict: cnsi_type/guid are populated on every bound endpoint; '' default keeps the lookups well-formed
    this.hasFavEntities = this.userFavoriteManager.endpointHasEntitiesThatCanFavorite(this.endpoint().cnsi_type ?? '');
    // Favorites for this endpoint
    this.favorites = this.userFavoriteManager.favoritesForEndpoint(this.endpoint().guid ?? '');
    this.entity = entityCatalog.getEndpoint(this.endpoint().cnsi_type ?? '', this.endpoint().sub_type);
    if (this.entity) {
      this.definition = this.entity.definition;
      this.favorite = this.userFavoriteManager.getFavoriteEndpointFromEntity(this.endpoint());
      this.definitionFullView.set(this.definition?.homeCard?.fullView ?? false);
      this.linksBelow = this.definition?.homeCard?.linksBelow ?? false;
      this.link = this.favorite ? this.favorite.getLink() : null;
      // Recompute effective layout now that definition is available
      this.computeEffectiveLayout();
      this.updateLayout();
    }

    // Self-trigger load now that @Input endpoint is bound. This used to be
    // driven by the parent's QueryList walk, which raced with input
    // bindings and stranded cards on the showMode=false render path.
    this.load();
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
      this.ref.setInput('layout', this.pLayout);
    }
  }

  async createCard(endpointEntity: any) {
    this.customCard().clear();

    let component: any;
    if (!endpointEntity) {
      component = DefaultEndpointHomeComponent;
    } else {
      component = await endpointEntity.definition.homeCard.component();
    }

    this.ref = this.customCard().createComponent(component);
    this.ref.setInput('endpoint', this.endpoint());
    this.ref.setInput('layout', this.pLayout);
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
          this.loaded.emit(void 0);
        },
        error: () => {
          this.loaded.emit(void 0);
          this._status.set(Status.Error);
          this.sub.unsubscribe();
        }
      });
    }
  }

  public showFavoritesPanel() {
    this.sidePanelService.showMode(SidePanelMode.Narrow, FavoritesSidePanelComponent, {
      endpoint: this.endpoint(),
      favorites: this.favorites
    });
  }
}
