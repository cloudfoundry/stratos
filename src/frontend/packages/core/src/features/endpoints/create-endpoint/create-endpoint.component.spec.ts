import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SharedModule } from '../../../shared/shared.module';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect/create-endpoint-connect.component';
import { CreateEndpointComponent } from './create-endpoint.component';

describe('CreateEndpointComponent', () => {
  let component: CreateEndpointComponent;
  let fixture: ComponentFixture<CreateEndpointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateEndpointComponent,
        CreateEndpointCfStep1Component,
        CreateEndpointConnectComponent,
        ConnectEndpointComponent
      ],
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule
      ],
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: {},
            params: {
              type: 'metrics',
              subtype: null
            }
          }
        }
      },
        TabNavService,
        SidePanelService],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
