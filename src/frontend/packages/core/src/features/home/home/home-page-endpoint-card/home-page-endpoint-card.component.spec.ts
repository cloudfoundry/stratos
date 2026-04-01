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
      mockEndpoint.guid,              // endpointId
      mockEndpoint.cnsi_type,          // endpointType (metrics)
      'endpoint',                      // entityType (this is an endpoint favorite)
      mockEndpoint.guid,               // entityId
      {
        name: mockEndpoint.name || 'Test Endpoint',
        guid: mockEndpoint.guid,
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
