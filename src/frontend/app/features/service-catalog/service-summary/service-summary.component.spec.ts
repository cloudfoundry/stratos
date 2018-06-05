import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardNumberMetricComponent } from '../../../shared/components/cards/card-number-metric/card-number-metric.component';
import {
  ServiceBrokerCardComponent,
} from '../../../shared/components/cards/service-broker-card/service-broker-card.component';
import {
  ServiceRecentInstancesCardComponent,
} from '../../../shared/components/cards/service-recent-instances-card/service-recent-instances-card.component';
import {
  ServiceSummaryCardComponent,
} from '../../../shared/components/cards/service-summary-card/service-summary-card.component';
import { TileGridComponent } from '../../../shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../shared/components/tile/tile/tile.component';
import { BaseTestModulesNoShared, BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../services.service';
import { ServicesServiceMock } from '../services.service.mock';
import { ServiceSummaryComponent } from './service-summary.component';
import { ServiceIconComponent } from '../../../shared/components/service-icon/service-icon.component';

describe('ServiceSummaryComponent', () => {
  let component: ServiceSummaryComponent;
  let fixture: ComponentFixture<ServiceSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceSummaryComponent,
      ],
      imports: [BaseTestModules],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
