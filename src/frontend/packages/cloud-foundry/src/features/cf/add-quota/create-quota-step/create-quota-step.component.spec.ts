import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogHelper, appReducers, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { generateCFEntities } from '@test-framework/cf';
import { CreateQuotaStepComponent } from './create-quota-step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('CreateQuotaStepComponent', () => {
  let component: CreateQuotaStepComponent;
  let fixture: ComponentFixture<CreateQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateQuotaStepComponent,
        QuotaDefinitionFormComponent,
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideStore(appReducers),
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
        }
      ]
    });

    fixture = TestBed.createComponent(CreateQuotaStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
