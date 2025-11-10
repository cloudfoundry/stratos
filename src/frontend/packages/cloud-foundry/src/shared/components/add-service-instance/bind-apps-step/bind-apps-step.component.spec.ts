import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { provideStore } from '@ngrx/store';
import { appReducers } from '@stratosui/store';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { SchemaFormComponent } from '../../schema-form/schema-form.component';
import { CsiGuidsService } from '../csi-guids.service';
import { BindAppsStepComponent } from './bind-apps-step.component';

describe('BindAppsStepComponent', () => {
  let component: BindAppsStepComponent;
  let fixture: ComponentFixture<BindAppsStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BindAppsStepComponent,
        SchemaFormComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideStore(appReducers, {
          runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false }
        }),
        { provide: ServicesService, useClass: ServicesServiceMock },
        CsiGuidsService,
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BindAppsStepComponent);
    component = fixture.componentInstance;
    component.boundAppId = '';
    component.apps$ = of([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
