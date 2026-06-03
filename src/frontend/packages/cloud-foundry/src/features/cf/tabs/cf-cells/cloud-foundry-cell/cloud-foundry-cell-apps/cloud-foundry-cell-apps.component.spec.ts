import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { ActiveRouteCfCell, generateCFEntities } from '@test-framework/cf';
import { CloudFoundryCellAppsComponent } from './cloud-foundry-cell-apps.component';

describe('CloudFoundryCellAppsComponent', () => {
  let component: CloudFoundryCellAppsComponent;
  let fixture: ComponentFixture<CloudFoundryCellAppsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryCellAppsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          StoreModule.forRoot(appReducers, {
            runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
          }),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: ActiveRouteCfCell,
          useValue: { cfGuid: testSCFEndpointGuid, cellId: 'test-cell' }
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
