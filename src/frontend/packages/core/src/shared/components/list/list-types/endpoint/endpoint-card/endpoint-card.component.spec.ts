import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { BaseTestModules } from '../../../../../../../test-framework/core-test.helper';
import {
  MetricsEndpointDetailsComponent,
} from '../../../../../../features/metrics/metrics-endpoint-details/metrics-endpoint-details.component';
import { MetricsService } from '../../../../../../features/metrics/services/metrics-service';
import { EndpointListHelper } from '../endpoint-list.helpers';
import { EndpointCardComponent } from './endpoint-card.component';

describe('EndpointCardComponent', () => {
  let component: EndpointCardComponent;
  let fixture: ComponentFixture<EndpointCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModules,
        EndpointCardComponent,
        MetricsEndpointDetailsComponent
      ],
      providers: [
        EndpointListHelper,
        MetricsService
      ],
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointCardComponent);
    component = fixture.componentInstance;
    component.row = {
      cnsi_type: 'metrics',
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
