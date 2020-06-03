import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../core/core.module';
import { SidePanelService } from '../../../../shared/services/side-panel.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect.component';

describe('CreateEndpointConnectComponent', () => {
  let component: CreateEndpointConnectComponent;
  let fixture: ComponentFixture<CreateEndpointConnectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CreateEndpointConnectComponent,
        ConnectEndpointComponent,
      ],
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        RouterTestingModule,
        createBasicStoreModule(),
      ],
      providers: [SidePanelService],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
