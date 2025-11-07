import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { DiagnosticsPageComponent } from './diagnostics-page.component';

describe('DiagnosticsPageComponent', () => {
  let component: DiagnosticsPageComponent;
  let fixture: ComponentFixture<DiagnosticsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        DiagnosticsPageComponent,
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
