import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import {
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';
import { EditQuotaStepComponent } from './edit-quota-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

// Mock QuotaDefinitionFormComponent since it has complex dependencies
@Component({
  selector: 'app-quota-definition-form',
  template: '<div></div>',
  standalone: true
})
class MockQuotaDefinitionFormComponent {
  formGroup = new FormGroup({
    name: new FormControl(''),
    totalServices: new FormControl(0),
    totalRoutes: new FormControl(0),
    memoryLimit: new FormControl(0),
    instanceMemoryLimit: new FormControl(0),
    nonBasicServicesAllowed: new FormControl(false),
    totalReservedRoutePorts: new FormControl(0),
    appInstanceLimit: new FormControl(0),
    totalServiceKeys: new FormControl(0),
    totalPrivateDomains: new FormControl(0),
    appTasksLimit: new FormControl(0),
  });

  valid() { return true; }
}

describe('EditQuotaStepComponent', () => {
  let component: EditQuotaStepComponent;
  let fixture: ComponentFixture<EditQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditQuotaStepComponent,
        MockQuotaDefinitionFormComponent,
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                endpointId: 'cfGuid'
              },
              queryParams: {}
            },
          }
        }
      ]
    });

    // Manually initialize EntityCatalogHelper for components that use it in constructor
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(EditQuotaStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
