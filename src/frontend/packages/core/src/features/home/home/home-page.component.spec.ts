import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';
import { EntityCatalogHelper, EntityCatalogHelpers, entityCatalog, generateStratosEntities } from '@stratosui/store';

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

  // The former "does not dispatch a redundant endpoint getAll on construction"
  // test guarded against an ngrx-dispatch regression. With the ngrx store
  // removed, HomePageComponent is fully signal-native (reads EndpointsService
  // observables via toSignal, never triggers endpoint loading on construction),
  // so that non-behavior is now structurally guaranteed — the test had no
  // mechanism left to assert against and was removed with the store.
});
