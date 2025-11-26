import { DatePipe } from '@angular/common';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { createEmptyStoreModule } from '@stratosui/store/testing';
import { EntityServiceFactory, EntityMonitorFactory, PaginationMonitorFactory } from '@stratosui/store';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep1Component } from './edit-autoscaler-policy-step1.component';

describe('EditAutoscalerPolicyStep1Component', () => {
  let component: EditAutoscalerPolicyStep1Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep1Component>;
  let mockEntityServiceFactory: Partial<EntityServiceFactory>;

  beforeEach(() => {
    // Create a mock entity service that emits proper values
    const entityObsSubject = new BehaviorSubject({
      entity: null,
      entityRequestInfo: {
        fetching: false,
        error: true // Simulate error to satisfy the filter and complete the observable
      }
    });

    mockEntityServiceFactory = {
      create: vi.fn().mockReturnValue({
        entityObs$: entityObsSubject.asObservable(),
        waitForEntity$: entityObsSubject.asObservable()
      })
    };

    TestBed.configureTestingModule({
      imports: [
        EditAutoscalerPolicyStep1Component,
        CfAutoscalerTestingModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        RouterTestingModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        { provide: EntityServiceFactory, useValue: mockEntityServiceFactory },
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EditAutoscalerPolicyService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAutoscalerPolicyStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
