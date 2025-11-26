import { DatePipe } from '@angular/common';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { StoreModule } from '@ngrx/store';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { appReducers, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { generateASEntities } from '@stratosui/cf-autoscaler';
import { getCfSpaceServiceMock, generateCFEntities } from '@test-framework/cf';
import { CloudFoundrySpaceUserServiceInstancesComponent } from './cloud-foundry-space-user-service-instances.component';

describe('CloudFoundrySpaceUserServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceUserServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceUserServiceInstancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CloudFoundrySpaceUserServiceInstancesComponent,
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
            ...generateCFEntities(),
            ...generateASEntities()
          ]
        },
        getCfSpaceServiceMock,
        DatePipe,
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceUserServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
