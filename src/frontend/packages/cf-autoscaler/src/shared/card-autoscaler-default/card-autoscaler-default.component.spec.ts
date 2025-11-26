import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApplicationServiceMock, ApplicationStateService } from "@test-framework/cf";
import { ApplicationService } from '@stratosui/cloud-foundry';
import { CoreModule } from '@stratosui/core';
import { generateBaseTestStoreModules } from '@test-framework/core-test.helper';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { CardAutoscalerDefaultComponent } from './card-autoscaler-default.component';

describe('CardAutoscalerDefaultComponent', () => {
  let component: CardAutoscalerDefaultComponent;
  let fixture: ComponentFixture<CardAutoscalerDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardAutoscalerDefaultComponent,
      ],
      providers: [
        importProvidersFrom(
          CfAutoscalerTestingModule,
          ...generateBaseTestStoreModules(),
          CoreModule,
          NoopAnimationsModule
        ),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAutoscalerDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
