import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppTestModule } from '@test-framework';
import { ApplicationServiceMock, ApplicationStateService } from '@test-framework/cf';
import { ApplicationService } from '@stratosui/cloud-foundry';
import { CurrentUserPermissionsService, TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { EditAutoscalerCredentialComponent } from './edit-autoscaler-credential.component';

describe('EditAutoscalerCredentialComponent', () => {
  let component: EditAutoscalerCredentialComponent;
  let fixture: ComponentFixture<EditAutoscalerCredentialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditAutoscalerCredentialComponent,
        RouterTestingModule,
        createBasicStoreModule(),
        CfAutoscalerTestingModule,
        AppTestModule,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        TabNavService,
        CurrentUserPermissionsService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAutoscalerCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
