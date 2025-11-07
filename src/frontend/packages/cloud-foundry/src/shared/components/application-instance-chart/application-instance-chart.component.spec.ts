import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySharedModule } from '../../cf-shared.module';
import { ApplicationInstanceChartComponent } from "./application-instance-chart.component";
describe('ApplicationInstanceChartComponent', () => {
  let component: ApplicationInstanceChartComponent;
  let fixture: ComponentFixture<ApplicationInstanceChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ...generateCfStoreModules(),
        RouterTestingModule,
        CoreModule,
        SharedModule,
        CloudFoundrySharedModule,
        NoopAnimationsModule,
    ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationInstanceChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
