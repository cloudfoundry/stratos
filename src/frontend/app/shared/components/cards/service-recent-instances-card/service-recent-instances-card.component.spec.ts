import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceRecentInstancesCardComponent } from './service-recent-instances-card.component';
import { BaseTestModulesNoShared, MetadataCardTestComponents } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { StatefulIconComponent } from '../../stateful-icon/stateful-icon.component';
import { CompactServiceInstanceCardComponent } from '../compact-service-instance-card/compact-service-instance-card.component';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import { AppChipsComponent } from '../../chips/chips.component';

describe('ServiceRecentInstancesCardComponent', () => {
  let component: ServiceRecentInstancesCardComponent;
  let fixture: ComponentFixture<ServiceRecentInstancesCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceRecentInstancesCardComponent,
        MetadataCardTestComponents,
        StatefulIconComponent,
        CompactServiceInstanceCardComponent,
        AppChipsComponent

      ],
      imports: [BaseTestModulesNoShared],
      providers: [
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceRecentInstancesCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
