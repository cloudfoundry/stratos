import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { PageHeaderModule } from '../../../shared/components/page-header/page-header.module';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { SetupModule } from '../setup.module';
import { ConsoleUaaWizardComponent } from './console-uaa-wizard.component';

describe('ConsoleUaaWizardComponent', () => {
  let component: ConsoleUaaWizardComponent;
  let fixture: ComponentFixture<ConsoleUaaWizardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        SetupModule,
        RouterTestingModule,
        FormsModule,
        PageHeaderModule,
        ReactiveFormsModule,
        MDAppModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule,
      ],
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        TabNavService,
        CurrentUserPermissionsService,
        provideZonelessChangeDetection(),
      ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleUaaWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
