import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import {
  EntityCatalogTestModuleManualStore,
  EntityServiceFactory,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { AppTestModule } from '@test-framework/core-test.helper';

import { CreateEndpointBaseStepComponent } from './create-endpoint-base-step.component';

describe('CreateEndpointBaseStepComponent', () => {
  let component: CreateEndpointBaseStepComponent;
  let fixture: ComponentFixture<CreateEndpointBaseStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        AppTestModule,
        CreateEndpointBaseStepComponent,
        {
          ngModule: EntityCatalogTestModuleManualStore,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        EntityServiceFactory,
        ...(STORE_TEST_PROVIDERS || []),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {}
            }
          }
        },
        provideHttpClient(),
        provideZonelessChangeDetection(),
      ],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointBaseStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
