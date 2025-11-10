import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TailwindJsonSchemaFormModule } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { LongRunningCfOperationsService } from '../../../data-services/long-running-cf-op.service';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CsiGuidsService } from '../csi-guids.service';
import { CsiModeService } from '../csi-mode.service';
import { SpecifyDetailsStepComponent } from './specify-details-step.component';

describe('SpecifyDetailsStepComponent', () => {
  let component: SpecifyDetailsStepComponent;
  let fixture: ComponentFixture<SpecifyDetailsStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SpecifyDetailsStepComponent,
        SchemaFormComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          ...generateCfBaseTestModulesNoShared(),
          TailwindJsonSchemaFormModule,
        ),
        CreateServiceInstanceHelperServiceFactory,
        CsiGuidsService,
        CsiModeService,
        LongRunningCfOperationsService,
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecifyDetailsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
