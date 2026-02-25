import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { CoreModule, TabNavService } from '@stratosui/core';
import { generateBaseTestStoreModules } from '@test-framework/core-test.helper';
import { EntityServiceFactory } from '@stratosui/store';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { AutoscalerTabExtensionComponent } from './autoscaler-tab-extension.component';

describe('AutoscalerTabExtensionComponent', () => {
  let component: AutoscalerTabExtensionComponent;
  let fixture: ComponentFixture<AutoscalerTabExtensionComponent>;

  beforeEach(() => {
    // Create mock observables that emit proper values before completing
    const entityObsSubject = new BehaviorSubject({
      entityRequestInfo: {
        fetching: false,
        error: false
      },
      entity: {
        entity: {
          instance_min_count: 1,
          instance_max_count: 10,
          scaling_rules_map: {}
        }
      }
    });

    const waitForEntitySubject = new BehaviorSubject({
      entity: {
        entity: {
          instance_min_count: 1,
          instance_max_count: 10,
          scaling_rules_map: {}
        }
      }
    });

    // Create a mock EntityServiceFactory that returns services with proper observables
    const mockEntityServiceFactory = {
      create: vi.fn().mockReturnValue({
        entityObs$: entityObsSubject.asObservable(),
        waitForEntity$: waitForEntitySubject.asObservable(),
        entityMonitor: {
          entityRequest$: new BehaviorSubject({
            error: false,
            message: ''
          }).asObservable()
        }
      })
    };

    TestBed.configureTestingModule({
      imports: [
        AutoscalerTabExtensionComponent,
      ],
      providers: [
        importProvidersFrom(
          CfAutoscalerTestingModule,
          ...generateBaseTestStoreModules(),
          CoreModule,
          NoopAnimationsModule
        ),
        provideRouter([]),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: EntityServiceFactory, useValue: mockEntityServiceFactory },
        TabNavService,
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerTabExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
