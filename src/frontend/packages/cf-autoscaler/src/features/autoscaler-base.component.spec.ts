import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ApplicationService, generateCFEntities } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { CoreModule, TabNavService } from '@stratosui/core';
import { generateBaseTestStoreModules } from '@test-framework/core-test.helper';
import { CATALOGUE_ENTITIES } from '@stratosui/store';
import { generateASEntities } from '../store/autoscaler-entity-generator';
import { AutoscalerBaseComponent } from './autoscaler-base.component';

describe('AutoscalerBaseComponent', () => {
  let component: AutoscalerBaseComponent;
  let fixture: ComponentFixture<AutoscalerBaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AutoscalerBaseComponent,
      ],
      providers: [
        importProvidersFrom(
          ...generateBaseTestStoreModules(),
          CoreModule,
          NoopAnimationsModule
        ),
        {
          provide: CATALOGUE_ENTITIES,
          useFactory: () => [
            ...generateASEntities(),
            ...generateCFEntities()
          ],
          multi: true
        },
        provideRouter([]),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
