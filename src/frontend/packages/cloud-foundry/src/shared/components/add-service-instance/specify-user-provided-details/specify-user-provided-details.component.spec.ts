import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { generateCfBaseTestModulesNoShared } from "@test-framework/cf";
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryUserProvidedServicesService } from '../../../services/cloud-foundry-user-provided-services.service';
import { CsiModeService } from '../csi-mode.service';
import { CsiStateService } from '../csi-state.service';
import { SpecifyUserProvidedDetailsComponent } from "./specify-user-provided-details.component";

describe('SpecifyUserProvidedDetailsComponent', () => {
  let component: SpecifyUserProvidedDetailsComponent;
  let fixture: ComponentFixture<SpecifyUserProvidedDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SpecifyUserProvidedDetailsComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          generateCfBaseTestModulesNoShared(),
        ),
        CsiModeService,
        CsiStateService,
        CloudFoundryUserProvidedServicesService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpecifyUserProvidedDetailsComponent);
    component = fixture.componentInstance;

    // Set required inputs
    component.cfGuid = 'test-cf-guid';
    component.spaceGuid = 'test-space-guid';
    component.appId = 'test-app-id';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
