import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { CoreModule } from '@stratosui/core';
import {
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule
} from '@stratosui/store';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { generateCFEntities } from '@stratosui/cloud-foundry';

import { ServiceIconComponent } from './service-icon.component';

describe('ServiceIconComponent', () => {
  let component: ServiceIconComponent;
  let fixture: ComponentFixture<ServiceIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ServiceIconComponent,
        NoopAnimationsModule,
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        importProvidersFrom(
          createBasicStoreModule(),
          CoreModule,
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
