import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createEmptyStoreModule } from "@test-framework/cf-autoscaler-test.helper";

import { ApplicationService, RunningInstancesComponent, ApplicationStateService } from '@stratosui/cloud-foundry';
import { ApplicationServiceMock } from '@stratosui/cloud-foundry/testing';
import { CoreModule, CopyToClipboardComponent, MetadataItemComponent, AppTestModule } from '@stratosui/core';
import { EntityCatalogHelper, EntityMonitorFactory, PaginationMonitorFactory, EntityServiceFactory } from '@stratosui/store';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { CardAutoscalerDefaultComponent } from './card-autoscaler-default.component';

describe('CardAutoscalerDefaultComponent', () => {
  let component: CardAutoscalerDefaultComponent;
  let fixture: ComponentFixture<CardAutoscalerDefaultComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAutoscalerDefaultComponent,
        MetadataItemComponent,
        CopyToClipboardComponent,
        RunningInstancesComponent,
      ],
      imports: [
        CfAutoscalerTestingModule,
        CoreModule,
        CommonModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        AppTestModule,
      ],
      providers: [
        EntityServiceFactory,
        
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper,

        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
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
