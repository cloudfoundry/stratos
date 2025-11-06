import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "../test-framework/core-test.helper";

import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';
import { SidePanelService } from '../../../../shared/services/side-panel.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect.component';

describe('CreateEndpointConnectComponent', () => {
  let component: CreateEndpointConnectComponent;
  let fixture: ComponentFixture<CreateEndpointConnectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        RouterTestingModule,
        createBasicStoreModule(),,
        CreateEndpointConnectComponent,
        ConnectEndpointComponent
      ],
      providers: [
        SidePanelService,
        provideZonelessChangeDetection()
      ],
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
