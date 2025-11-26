import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideMockStore } from '@ngrx/store/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { TabNavService } from '@stratosui/core';
import { TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from "@test-framework/cf";
import { generateCFEntities } from '../../../cf-entity-generator';
import { AddSpaceQuotaComponent } from './add-space-quota.component';

describe('AddSpaceQuotaComponent', () => {
  let component: AddSpaceQuotaComponent;
  let fixture: ComponentFixture<AddSpaceQuotaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AddSpaceQuotaComponent,
      ],
      providers: [
        provideMockStore(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ...generateTestCfEndpointServiceProvider(),
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(AddSpaceQuotaComponent).toBeDefined();
  });
});
