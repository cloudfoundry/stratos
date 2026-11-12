import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EndpointModel, UserFavoriteManager, UserFavorite, IEndpointFavMetadata, entityCatalog } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { SidePanelService } from '@stratosui/core';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { HomePageCardLayout } from '../../home.types';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card.component';

// Stands in for an endpoint type's home card.
@Component({ selector: 'app-mock-card', template: '', standalone: true })
class MockCardComponent {
  readonly endpoint = input<any>();
  readonly layout = input<any>();
}

const mockEntity = {
  definition: {
    homeCard: {
      component: () => Promise.resolve(MockCardComponent),
    },
  },
};

describe('HomePageEndpointCardComponent', () => {
  let component: HomePageEndpointCardComponent;
  let fixture: ComponentFixture<HomePageEndpointCardComponent>;
  let userFavoriteManager: UserFavoriteManager;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        RouterTestingModule,
        NoopAnimationsModule,
        HomePageEndpointCardComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...(STORE_TEST_PROVIDERS || []),
        SidePanelService,
        UserFavoriteManager,
        provideZonelessChangeDetection(),
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageEndpointCardComponent);
    component = fixture.componentInstance;
    userFavoriteManager = TestBed.inject(UserFavoriteManager);

    // Create a proper UserFavorite mock for the endpoint
    const mockEndpoint: EndpointModel = {
      cnsi_type: 'metrics',
      guid: 'test-guid',
      name: 'Test Metrics'
    } as EndpointModel;

    // UserFavorite constructor: (endpointId, endpointType, entityType, entityId, metadata)
    // For endpoint favorites, entityType is 'endpoint' and endpointType is the endpoint's cnsi_type
    const mockFavorite = new UserFavorite<IEndpointFavMetadata>(
      // strict: mockEndpoint is built above with guid: 'test-guid' set
      mockEndpoint.guid!,              // endpointId
      // strict: mockEndpoint is built above with cnsi_type: 'metrics' set
      mockEndpoint.cnsi_type!,         // endpointType (metrics)
      'endpoint',                      // entityType (this is an endpoint favorite)
      mockEndpoint.guid,               // entityId
      {
        name: mockEndpoint.name || 'Test Endpoint',
        // strict: mockEndpoint is built above with guid: 'test-guid' set
        guid: mockEndpoint.guid!,
        // strict: mockEndpoint is built above with cnsi_type: 'metrics' set
        subType: mockEndpoint.cnsi_type!,
      }
    );

    // Mock UserFavoriteManager methods used in ngOnInit
    vi.spyOn(userFavoriteManager, 'endpointHasEntitiesThatCanFavorite').mockReturnValue(false);
    vi.spyOn(userFavoriteManager, 'favoritesForEndpoint').mockReturnValue(signal([]));
    vi.spyOn(userFavoriteManager, 'getFavoriteEndpointFromEntity').mockReturnValue(mockFavorite as any);

    // Set required input
    fixture.componentRef.setInput('endpoint', mockEndpoint);

    await fixture.whenStable();
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load default component when no endpoint entity provided', async () => {
    await component.createCard(undefined);
    expect(component['ref']).toBeTruthy();
  });

  // #5588 — disconnected endpoints render a Disconnected panel, no home card load
  it('renders a Disconnected panel with a Connect button instead of loading the card', () => {
    // beforeEach endpoint has no connectionStatus => not connected
    expect(component.disconnected).toBe(true);
    expect(component['ref']).toBeFalsy();
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    expect(buttons.some(b => b.textContent?.trim() === 'Connect')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Disconnected');
  });

  it('does not present a connected endpoint as disconnected', () => {
    fixture.componentRef.setInput('endpoint', { ...component.endpoint(), connectionStatus: 'connected' });
    expect(component.disconnected).toBe(false);
  });

  it('presents a connected endpoint with an expired token as disconnected', () => {
    // endpoint-token-lifecycle (Task 3): connectionStatus is now computed
    // once at hydration time (computeConnectionStatus) rather than derived
    // again here from token_expiry, so an expired token is represented
    // directly as connectionStatus: 'expired' rather than the old
    // 'connected' + stale-token_expiry combination.
    fixture.componentRef.setInput('endpoint', { ...component.endpoint(), connectionStatus: 'expired', token_expiry: 1 });
    expect(component.disconnected).toBe(true);
  });

  it('ignores a future token expiry', () => {
    fixture.componentRef.setInput('endpoint', { ...component.endpoint(), connectionStatus: 'connected', token_expiry: Math.floor(Date.now() / 1000) + 3600 });
    expect(component.disconnected).toBe(false);
  });

  it('does not create the card twice when the endpoint input rebinds during load', () => {
    const spy = vi.spyOn(component, 'createCard').mockResolvedValue(undefined as any);
    fixture.componentRef.setInput('endpoint', { ...component.endpoint(), connectionStatus: 'connected' });
    // Simulate: rebind fires while ngAfterViewInit's create is still awaiting
    component.ngOnChanges({ endpoint: { currentValue: component.endpoint() } } as any);
    component.ngAfterViewInit();
    component.ngOnChanges({ endpoint: { currentValue: component.endpoint() } } as any);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('treats an expired access token as alive when jetstream can refresh it', () => {
    fixture.componentRef.setInput('endpoint', { ...component.endpoint(), connectionStatus: 'connected', token_expiry: 1, token_renewable: true });
    expect(component.disconnected).toBe(false);
  });

  it('should load component from homeCard.component() when endpoint entity provided', async () => {
    await component.createCard(mockEntity);
    expect(component['ref']).toBeTruthy();
    expect(component['ref'].instance).toBeInstanceOf(MockCardComponent);
    // The host hands the card its endpoint through the card's input.
    expect((component['ref'].instance as unknown as MockCardComponent).endpoint()).toBe(component.endpoint());
  });

  it('hands the card the layout the home page sets, and each later change', async () => {
    const cardLayout = () => (component['ref'].instance as unknown as MockCardComponent).layout();
    fixture.componentRef.setInput('layout', new HomePageCardLayout(2, 1));
    await fixture.whenStable();
    await component.createCard(mockEntity);
    expect(cardLayout()).toEqual(new HomePageCardLayout(2, 1));

    fixture.componentRef.setInput('layout', new HomePageCardLayout(3, 2));
    await fixture.whenStable();
    expect(cardLayout()).toEqual(new HomePageCardLayout(3, 2));
    expect(component.layoutSignal()).toEqual(new HomePageCardLayout(3, 2));

    // Null (the persisted layout has not hydrated) keeps the last layout.
    fixture.componentRef.setInput('layout', null);
    await fixture.whenStable();
    expect(cardLayout()).toEqual(new HomePageCardLayout(3, 2));
  });

  // A type with no image file, such as the autoscaler, has only a font icon.
  it('draws the font icon when the type has no image', async () => {
    const getEndpoint = vi.spyOn(entityCatalog, 'getEndpoint').mockReturnValue({
      definition: { label: 'Test type', unConnectable: true, logoUrl: '', icon: 'meter', iconFont: 'stratos-icons' },
    } as never);
    const card = TestBed.createComponent(HomePageEndpointCardComponent);
    card.componentRef.setInput('endpoint', { cnsi_type: 'test-type', guid: 'g', name: 'n' } as EndpointModel);
    await card.whenStable();

    const icon = card.nativeElement.querySelector('.card-header i.stratos-icons');
    expect(icon?.textContent?.trim()).toBe('meter');
    expect(card.nativeElement.querySelector('.card-header img')).toBeNull();
    // The box keeps the title in line with its neighbours, whose images are 48px.
    expect(icon.closest('app-custom-icon').classList).toContain('text-[48px]');
    expect(icon.closest('app-custom-icon').parentElement.classList).toContain('w-12');
    card.destroy();
    getEndpoint.mockRestore();
  });

  // The header opens the endpoint's page: a link, so the keyboard reaches it
  // (#4168, WCAG 2.1.1), not a div with a routerLink.
  it('makes the header of a reachable endpoint a link to its page', async () => {
    const getEndpoint = vi.spyOn(entityCatalog, 'getEndpoint').mockReturnValue({
      definition: { label: 'Test type', unConnectable: true, logoUrl: '', icon: 'meter', iconFont: 'stratos-icons' },
    } as never);
    const getFavorite = vi.spyOn(userFavoriteManager, 'getFavoriteEndpointFromEntity')
      .mockReturnValue({ getLink: () => '/endpoints/g' } as never);
    const card = TestBed.createComponent(HomePageEndpointCardComponent);
    card.componentRef.setInput('endpoint', { cnsi_type: 'test-type', guid: 'g', name: 'Lab CF' } as EndpointModel);
    await card.whenStable();

    const link = card.nativeElement.querySelector('.card-header a') as HTMLAnchorElement;
    expect(link?.getAttribute('href')).toBe('/endpoints/g');
    expect(link.textContent).toContain('Lab CF');
    card.destroy();
    getFavorite.mockRestore();
    getEndpoint.mockRestore();
  });
});
