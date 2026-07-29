import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, EmbeddedViewRef, ViewContainerRef, provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';
import {
  EndpointModel,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  IUserFavoritesGroups,
  UserFavoriteManager,
  entityCatalog,
  generateStratosEntities,
} from '@stratosui/store';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { TabNavService } from '../../../tab-nav.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HomePageComponent } from './home-page.component';

function makeStubEndpointsService(disablePersistenceFeatures: boolean, endpoints: Record<string, EndpointModel> = {}): Partial<EndpointsService> {
  return {
    disablePersistenceFeatures$: of(disablePersistenceFeatures),
    haveRegistered$: of(Object.keys(endpoints).length > 0),
    connectedEndpoints$: of(Object.values(endpoints).filter(ep => ep.connectionStatus === 'connected')),
    endpoints$: of(endpoints),
  } as Partial<EndpointsService>;
}

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  async function configureTestBed(endpointsServiceStub: Partial<EndpointsService>, favGroups?: IUserFavoritesGroups) {
    (entityCatalog as any).clear();
    const entities = generateStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        HomePageComponent,
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EndpointsService, useValue: endpointsServiceStub },
        ...(favGroups ? [{ provide: UserFavoriteManager, useValue: { getAllFavorites: () => of([favGroups, []]) } }] : []),
      ]
    }).compileComponents();

    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  }

  it('should be created', async () => {
    await configureTestBed(makeStubEndpointsService(false));
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('redirects to /applications via Router when persistence features are disabled', async () => {
    await configureTestBed(makeStubEndpointsService(true));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HomePageComponent);
    flushEffects();

    expect(navigateSpy).toHaveBeenCalledWith(['applications'], { replaceUrl: true });
  });

  it('does not redirect when persistence features are enabled', async () => {
    await configureTestBed(makeStubEndpointsService(false));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HomePageComponent);
    flushEffects();

    expect(navigateSpy).not.toHaveBeenCalledWith(['applications'], expect.anything());
  });

  // The former "does not dispatch a redundant endpoint getAll on construction"
  // test guarded against an ngrx-dispatch regression. With the ngrx store
  // removed, HomePageComponent is fully signal-native (reads EndpointsService
  // observables via toSignal, never triggers endpoint loading on construction),
  // so that non-behavior is now structurally guaranteed — the test had no
  // mechanism left to assert against and was removed with the store.

  // #5588 — starred endpoints show regardless of connection state
  describe('starred endpoints vs connection state', () => {
    const downCf = {
      guid: 'ep1',
      name: 'down-cf',
      cnsi_type: 'cf',
      connectionStatus: 'disconnected',
    } as EndpointModel;

    const starredGroup = (ethereal: boolean): IUserFavoritesGroups => ({
      ep1: { ethereal, endpoint: { endpointId: 'ep1' } as any, entitiesIds: [] },
    });

    it('starred mode shows a directly starred endpoint even when disconnected', async () => {
      await configureTestBed(makeStubEndpointsService(false, { ep1: downCf }), starredGroup(false));
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      expect(component.endpoints().map(ep => ep.guid)).toEqual(['ep1']);
    });

    it('starred mode shows an endpoint with starred children (ethereal group) even when disconnected', async () => {
      await configureTestBed(makeStubEndpointsService(false, { ep1: downCf }), starredGroup(true));
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      expect(component.endpoints().map(ep => ep.guid)).toEqual(['ep1']);
    });

    it('starred mode hides endpoints that are not starred at all', async () => {
      await configureTestBed(makeStubEndpointsService(false, { ep1: downCf }), {});
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      expect(component.endpoints()).toEqual([]);
    });

    it('sorts same-type endpoints by natural name order within a group', async () => {
      const eps: Record<string, EndpointModel> = {
        ep10: { ...downCf, guid: 'ep10', name: 'cf10' },
        ep2: { ...downCf, guid: 'ep2', name: 'cf2' },
        ep1: { ...downCf, guid: 'ep1', name: 'cf1' },
      };
      const groups: IUserFavoritesGroups = Object.fromEntries(Object.keys(eps).map(g =>
        [g, { ethereal: false, endpoint: { endpointId: g } as any, entitiesIds: [] }]));
      await configureTestBed(makeStubEndpointsService(false, eps), groups);
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      expect(component.endpoints().map(ep => ep.name)).toEqual(['cf1', 'cf2', 'cf10']);
    });

    it('desc direction reverses the name tiebreak only', async () => {
      const eps: Record<string, EndpointModel> = {
        ep10: { ...downCf, guid: 'ep10', name: 'cf10' },
        ep2: { ...downCf, guid: 'ep2', name: 'cf2' },
        ep1: { ...downCf, guid: 'ep1', name: 'cf1' },
      };
      const groups: IUserFavoritesGroups = Object.fromEntries(Object.keys(eps).map(g =>
        [g, { ethereal: false, endpoint: { endpointId: g } as any, entitiesIds: [] }]));
      await configureTestBed(makeStubEndpointsService(false, eps), groups);
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      component.toggleSortDirection();
      expect(component.endpoints().map(ep => ep.name)).toEqual(['cf10', 'cf2', 'cf1']);
    });

    it('connected mode still only shows connected endpoints', async () => {
      await configureTestBed(makeStubEndpointsService(false, { ep1: downCf }), starredGroup(false));
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      component.setShowMode('connected');
      expect(component.endpoints()).toEqual([]);
    });

    it('all mode shows every endpoint regardless of state or stars', async () => {
      await configureTestBed(makeStubEndpointsService(false, { ep1: downCf }), {});
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      component.setShowMode('all');
      expect(component.endpoints().map(ep => ep.guid)).toEqual(['ep1']);
    });
  });

  // The header controls live in content projected into <app-page-header>, which
  // renders through a CDK portal attached to TabNavService — so none of it is in
  // the fixture's own DOM. Instantiate the header template directly to get at
  // the projected markup.
  describe('header controls', () => {
    async function renderHeader(): Promise<{ root: HTMLElement, view: EmbeddedViewRef<unknown> }> {
      await configureTestBed(makeStubEndpointsService(false));
      fixture = TestBed.createComponent(HomePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const headerDe = fixture.debugElement.query(By.directive(PageHeaderComponent));
      const header = headerDe.componentInstance as PageHeaderComponent;
      const view = headerDe.injector.get(ViewContainerRef).createEmbeddedView(header.pageHeaderTmpl);
      view.detectChanges();

      const root = view.rootNodes.find((n: Node) => n instanceof HTMLElement) as HTMLElement;
      return { root, view };
    }

    const filterGroup = (root: HTMLElement) => root.querySelector('[aria-label="Which endpoints to show"]')!;

    it('the endpoint filter group holds only the show-mode buttons', async () => {
      const { root } = await renderHeader();
      expect([...filterGroup(root).querySelectorAll('button')].map(b => b.textContent!.trim()))
        .toEqual(['Favorites', 'Connected', 'All']);
    });

    it('the sort toggle sits outside the endpoint filter group', async () => {
      const { root } = await renderHeader();
      const sort = root.querySelector('button[aria-label^="Sorted by endpoint name"]');
      expect(sort).toBeTruthy();
      expect(filterGroup(root).contains(sort)).toBe(false);
    });

    it('the card layout trigger is named and reports its open state', async () => {
      const { root, view } = await renderHeader();
      const trigger = root.querySelector('.dropdown > button') as HTMLButtonElement;
      expect(trigger.getAttribute('aria-label')).toBe('Card layout');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      // The trigger is projected content, so its bindings are checked with the
      // home component's view rather than the header's embedded one.
      trigger.click();
      fixture.detectChanges();
      view.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    // The tick is only faded to opacity-0 for unselected layouts, so without
    // aria-hidden its "done" ligature lands in every option's accessible name.
    it('layout options keep the tick glyph out of their accessible name', async () => {
      const { root } = await renderHeader();
      const options = [...root.querySelectorAll('.layout-dropdown__option')];
      expect(options.length).toBe(component.layouts.length);
      options.forEach(o => expect(o.querySelector('.material-icons')!.getAttribute('aria-hidden')).toBe('true'));
      expect(options.filter(o => o.getAttribute('aria-current') === 'true')).toHaveLength(1);
    });
  });
});
