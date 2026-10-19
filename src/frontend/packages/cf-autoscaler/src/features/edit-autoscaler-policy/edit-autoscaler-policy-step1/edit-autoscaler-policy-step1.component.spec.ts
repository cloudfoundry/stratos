import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratosui/store/testing';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@test-framework/cf';
import { TabNavService } from '@stratosui/core';
import { CfAutoscalerTestingModule } from '../../../cf-autoscaler-testing.module';
import { EditAutoscalerPolicyService } from '../edit-autoscaler-policy-service';
import { EditAutoscalerPolicyStep1Component } from './edit-autoscaler-policy-step1.component';

describe('EditAutoscalerPolicyStep1Component', () => {
  let component: EditAutoscalerPolicyStep1Component;
  let fixture: ComponentFixture<EditAutoscalerPolicyStep1Component>;

  beforeEach(() => {
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
        provideHttpClient(),
        provideHttpClientTesting(),
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
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

  // The defaults (min 1, max 10, the browser timezone) are a valid policy,
  // so Next must be enabled on a new policy.
  it('reports the default limits as valid', async () => {
    // A new policy: the autoscaler has none for the app yet.
    TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/policy'))
      .flush('Policy Not Found', { status: 404, statusText: 'Not Found' });
    // The state reaches the form once the load settles and the view renders.
    await vi.waitFor(() => expect(component.editLimitForm.controls.instance_min_count.value).toBe(1));
    expect(component.editLimitForm.controls.instance_max_count.value).toBe(10);
    expect(component.editLimitForm.valid).toBe(true);
    expect(await firstValueFrom(component.valid$)).toBe(true);
  });
});
