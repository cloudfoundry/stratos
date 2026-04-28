import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';
import { entityCatalog, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { TabNavService } from '../../../tab-nav.service';
import { HomePageComponent } from './home-page.component';

function makeStubEndpointsService(disablePersistenceFeatures: boolean): Partial<EndpointsService> {
  return {
    disablePersistenceFeatures$: of(disablePersistenceFeatures),
    haveRegistered$: of(false),
    connectedEndpoints$: of([]),
  } as Partial<EndpointsService>;
}

function flushEffects() {
  TestBed.inject(ApplicationRef).tick();
}

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  async function configureTestBed(endpointsServiceStub: Partial<EndpointsService>) {
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

  it('does not dispatch a redundant endpoint getAll on construction (auth.effects loads endpoints on session verify)', async () => {
    await configureTestBed(makeStubEndpointsService(false));
    const store = TestBed.inject(Store);
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(HomePageComponent);

    const endpointGetAllDispatches = dispatchSpy.mock.calls
      .map((args: unknown[]) => args[0] as { type?: string })
      .filter(action => action?.type === '[Endpoints] Get all');
    expect(endpointGetAllDispatches).toHaveLength(0);
  });
});
