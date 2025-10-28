import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { createBasicStoreModule } from '../../../../../../store/testing/public-api';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule, SharedModule } from '../../../../public-api';
import { SidePanelService } from '../../../../shared/services/side-panel.service';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card.component';

describe('HomePageEndpointCardComponent', () => {
  let component: HomePageEndpointCardComponent;
  let fixture: ComponentFixture<HomePageEndpointCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        CoreTestingModule,
        createBasicStoreModule(),
        HomePageEndpointCardComponent
      ],
      providers: [
        SidePanelService
      ]
    
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePageEndpointCardComponent);
    fixture.componentInstance.endpoint = {
      cnsi_type: 'metrics',
    } as EndpointModel;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
