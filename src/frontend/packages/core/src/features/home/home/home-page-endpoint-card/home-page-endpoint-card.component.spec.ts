import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { EndpointModel, UserFavoriteManager } from '@stratosui/store';
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

    // Mock UserFavoriteManager methods used in ngOnInit
    vi.spyOn(userFavoriteManager, 'endpointHasEntitiesThatCanFavorite').mockReturnValue(false);
    vi.spyOn(userFavoriteManager, 'getFavoritesForEndpoint').mockReturnValue(of([]));
    vi.spyOn(userFavoriteManager, 'getFavoriteEndpointFromEntity').mockReturnValue({
      getLink: () => '/test-link',
      getPrettyTypeName: () => 'Endpoint'
    } as any);

    // Set required input
    fixture.componentInstance.endpoint = {
      cnsi_type: 'metrics',
      guid: 'test-guid'
    } as EndpointModel;

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
});
