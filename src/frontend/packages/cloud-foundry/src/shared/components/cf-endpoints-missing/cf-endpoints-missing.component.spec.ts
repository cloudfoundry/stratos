import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { of as observableOf } from 'rxjs';

import { createBasicStoreModule } from '@stratosui/store/testing';
import { entityCatalog, TestEntityCatalog } from '@stratosui/store';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { generateCFEntities } from '../../../cf-entity-generator';
import { CfEndpointsMissingComponent } from './cf-endpoints-missing.component';

describe('CfEndpointsMissingComponent', () => {
  let component: CfEndpointsMissingComponent;
  let fixture: ComponentFixture<CfEndpointsMissingComponent>;

  beforeEach(() => {
    // Clear and register CF entities before TestBed configuration
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    generateCFEntities().forEach(entity => {
      entityCatalog.register(entity);
    });

    const mockCloudFoundryService = {
      hasConnectedCFEndpoints$: observableOf(false),
      hasRegisteredCFEndpoints$: observableOf(false),
    };

    TestBed.configureTestingModule({
      imports: [
        CfEndpointsMissingComponent,
        createBasicStoreModule(),
      ],
      providers: [
        { provide: CloudFoundryService, useValue: mockCloudFoundryService },
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointsMissingComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
