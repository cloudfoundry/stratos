import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "../test-framework/core-test.helper";

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SharedModule } from '../../../shared/shared.module';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointConfig } from '../connect.service';
import { CredentialsAuthFormComponent } from './auth-forms/credentials-auth-form.component';
import { ConnectEndpointDialogComponent } from './connect-endpoint-dialog.component';

class TailwindDialogRefMock {
}

class DialogDataMock implements ConnectEndpointConfig {
  guid = '57ab08d8-86cc-473a-8818-25d5e8d0ea23';
  name = 'Test';
  type = 'metrics';
  subType = null;
  ssoAllowed = false;
}

describe('ConnectEndpointDialogComponent', () => {
  let component: ConnectEndpointDialogComponent;
  let fixture: ComponentFixture<ConnectEndpointDialogComponent>;

  beforeEach(() => {
    const testingModule = TestBed.configureTestingModule({
      providers: [
        
        { provide: TailwindDialogRef, useClass: TailwindDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: DialogDataMock },
        SidePanelService
      ,
        provideZonelessChangeDetection()
      ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
        ConnectEndpointDialogComponent,
        ConnectEndpointComponent,
        CredentialsAuthFormComponent
      ]

    });
    testingModule.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectEndpointDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
