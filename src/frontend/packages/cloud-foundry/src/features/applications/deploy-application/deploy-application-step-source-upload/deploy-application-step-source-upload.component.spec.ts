import { describe, it, expect, beforeEach } from 'vitest';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { CATALOGUE_ENTITIES, entityCatalog, generateStratosEntities, type TestEntityCatalog } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationStepSourceUploadComponent } from "./deploy-application-step-source-upload.component";

describe('DeployApplicationStepSourceUploadComponent', () => {
  let component: DeployApplicationStepSourceUploadComponent;
  let fixture: ComponentFixture<DeployApplicationStepSourceUploadComponent>;

  beforeEach(async () => {
    // Initialize entity catalog with CF entities
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateCFEntities(),
      ...generateStratosEntities()
    ];
    entities.forEach(entity => testEntityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        DeployApplicationStepSourceUploadComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideMockStore(),
        ...STORE_TEST_PROVIDERS,
        {
          provide: CATALOGUE_ENTITIES,
          useValue: entities,
          multi: true
        },
        CfOrgSpaceDataService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeployApplicationStepSourceUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
