import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ApplicationService, generateCFEntities } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../../../cloud-foundry/src/features/applications/app-detail-data.service';
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

  // The policy editor and the other autoscaler pages get ApplicationService
  // from this component. It needs the app-detail services the app page
  // provides; without them every autoscaler page failed with NG0201.
  it('provides an ApplicationService its pages can use', () => {
    expect(() => fixture.debugElement.injector.get(ApplicationService)).not.toThrow();
  });

  // The pages read the app (name, instances) from AppDetailDataService,
  // which loads nothing until it is initialized, as the app page does.
  it('starts loading the app for its pages', () => {
    const initialize = vi.spyOn(AppDetailDataService.prototype, 'initialize').mockImplementation(() => undefined);
    const page = TestBed.createComponent(AutoscalerBaseComponent);
    page.detectChanges();
    expect(initialize).toHaveBeenCalledTimes(1);
    initialize.mockRestore();
  });
});
