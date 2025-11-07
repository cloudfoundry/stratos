import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { ApplicationService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@stratosui/cloud-foundry/testing';
import { CoreModule, CurrentUserPermissionsService, SharedModule, TabNavService } from '@stratosui/core';
import { createBasicStoreModule } from '@stratosui/store/testing';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { EditAutoscalerCredentialComponent } from './edit-autoscaler-credential.component';

describe('EditAutoscalerCredentialComponent', () => {
  let component: EditAutoscalerCredentialComponent;
  let fixture: ComponentFixture<EditAutoscalerCredentialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        EditAutoscalerCredentialComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        createBasicStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        CfAutoscalerTestingModule,
      ],
      providers: [
        
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        CurrentUserPermissionsService,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
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
