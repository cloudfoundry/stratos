import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { createEmptyStoreModule } from "@stratosui/store/testing";
import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService, CurrentUserPermissionsService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';
import { EditAutoscalerPolicyComponent } from './edit-autoscaler-policy.component';

describe('EditAutoscalerPolicyComponent', () => {
  let component: EditAutoscalerPolicyComponent;
  let fixture: ComponentFixture<EditAutoscalerPolicyComponent>;
  let mockEntityServiceFactory: any;

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
        EditAutoscalerPolicyComponent,
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
        EditAutoscalerPolicyService,
        CurrentUserPermissionsService,
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
    fixture = TestBed.createComponent(EditAutoscalerPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
