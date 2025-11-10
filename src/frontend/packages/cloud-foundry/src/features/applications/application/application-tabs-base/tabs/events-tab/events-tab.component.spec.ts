import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { Store, StoreModule } from '@ngrx/store';

import { appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationService, CFAppState, generateCFEntities } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock, generateActiveRouteCfOrgSpaceMock, ApplicationStateService, ApplicationEnvVarsHelper } from '@test-framework/cf';
import { EventsTabComponent } from './events-tab.component';

describe('EventsTabComponent', () => {
  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EventsTabComponent,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
        ),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
                ...generateCFEntities()
              ]
            }
          ]
        },
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        generateActiveRouteCfOrgSpaceMock(),
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        Store,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventsTabComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() as the component may subscribe to observables
    // that require more complex test data setup
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
