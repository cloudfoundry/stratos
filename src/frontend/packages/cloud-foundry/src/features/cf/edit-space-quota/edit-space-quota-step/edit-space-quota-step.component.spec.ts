import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { BaseTestModulesNoShared } from '@test-framework';
import { CFBaseTestProviders, generateCFEntities } from '@test-framework/cf-test-helper';
import { SpaceQuotaDefinitionFormComponent } from '../../space-quota-definition-form/space-quota-definition-form.component';
import { EditSpaceQuotaStepComponent } from './edit-space-quota-step.component';

describe('EditSpaceQuotaStepComponent', () => {
  let component: EditSpaceQuotaStepComponent;
  let fixture: ComponentFixture<EditSpaceQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditSpaceQuotaStepComponent,
        SpaceQuotaDefinitionFormComponent,
        ...BaseTestModulesNoShared,
        EntityCatalogTestModule,
      ],
      providers: [
        ...CFBaseTestProviders,
        provideZonelessChangeDetection(),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'test-quota-id',
                orgId: 'test-org-id',
                endpointId: 'test-cf-guid'
              },
              queryParams: {}
            },
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
