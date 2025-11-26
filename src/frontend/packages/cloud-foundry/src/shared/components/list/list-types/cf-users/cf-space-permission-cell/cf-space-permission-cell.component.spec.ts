import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { describe, it, expect, beforeEach } from 'vitest';

import { CoreModule } from '@stratosui/core';
import { appReducers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryTestingModule, generateTestCfEndpointServiceProvider } from '@test-framework/cf';
import { CfSpacePermissionCellComponent } from './cf-space-permission-cell.component';

describe('CfSpacePermissionCellComponent', () => {
  let component: CfSpacePermissionCellComponent;
  let fixture: ComponentFixture<CfSpacePermissionCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CfSpacePermissionCellComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          NoopAnimationsModule,
          StoreModule.forRoot(
            appReducers,
            { runtimeChecks: { strictStateImmutability: false, strictActionImmutability: false } }
          ),
          CloudFoundryTestingModule,
          CoreModule,
        ),
        ...generateTestCfEndpointServiceProvider(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CfSpacePermissionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
