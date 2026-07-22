import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { EndpointModel, UserFavoriteManager, UserFavorite, IEndpointFavMetadata } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { SidePanelService } from '@stratosui/core';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card.component';

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
        HttpClientModule,
        HomePageEndpointCardComponent,
      ],
      providers: [
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
    vi.spyOn(userFavoriteManager, 'getFavoritesForEndpoint').mockReturnValue(of([]));
    vi.spyOn(userFavoriteManager, 'getFavoriteEndpointFromEntity').mockReturnValue(mockFavorite as any);

    // Set required input
    fixture.componentInstance.endpoint = mockEndpoint;

    fixture.detectChanges();
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
    component.endpoint = { ...component.endpoint, connectionStatus: 'connected' };
    expect(component.disconnected).toBe(false);
  });

  it('presents a connected endpoint with an expired token as disconnected', () => {
    // endpoint-token-lifecycle (Task 3): connectionStatus is now computed
    // once at hydration time (computeConnectionStatus) rather than derived
    // again here from token_expiry, so an expired token is represented
    // directly as connectionStatus: 'expired' rather than the old
    // 'connected' + stale-token_expiry combination.
    component.endpoint = { ...component.endpoint, connectionStatus: 'expired', token_expiry: 1 };
    expect(component.disconnected).toBe(true);
  });

  it('ignores a future token expiry', () => {
    component.endpoint = { ...component.endpoint, connectionStatus: 'connected', token_expiry: Math.floor(Date.now() / 1000) + 3600 };
    expect(component.disconnected).toBe(false);
  });

  it('does not create the card twice when the endpoint input rebinds during load', () => {
    const spy = vi.spyOn(component, 'createCard').mockResolvedValue(undefined as any);
    component.endpoint = { ...component.endpoint, connectionStatus: 'connected' };
    // Simulate: rebind fires while ngAfterViewInit's create is still awaiting
    component.ngOnChanges({ endpoint: { currentValue: component.endpoint } } as any);
    component.ngAfterViewInit();
    component.ngOnChanges({ endpoint: { currentValue: component.endpoint } } as any);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('treats an expired access token as alive when jetstream can refresh it', () => {
    component.endpoint = { ...component.endpoint, connectionStatus: 'connected', token_expiry: 1, token_renewable: true };
    expect(component.disconnected).toBe(false);
  });

  it('should load component from homeCard.component() when endpoint entity provided', async () => {
    @Component({ selector: 'app-mock-card', template: '', standalone: true })
    class MockCardComponent {
      endpoint: any;
      layout: any;
    }

    const mockEntity = {
      definition: {
        homeCard: {
          component: () => Promise.resolve(MockCardComponent),
        },
      },
    };

    await component.createCard(mockEntity);
    expect(component['ref']).toBeTruthy();
    expect(component['ref'].instance).toBeInstanceOf(MockCardComponent);
  });
});
