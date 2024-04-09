import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppChipsComponent } from '../../../../../../core/src/shared/components/chips/chips.component';
import { MetadataCardTestComponents } from '../../../../../../core/test-framework/core-test.helper';
import { generateCfBaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../features/service-catalog/services.service.mock';
import {
  CompactServiceInstanceCardComponent,
} from '../compact-service-instance-card/compact-service-instance-card.component';
import { ServiceRecentInstancesCardComponent } from './service-recent-instances-card.component';

describe('ServiceRecentInstancesCardComponent', () => {
  let component: ServiceRecentInstancesCardComponent;
  let fixture: ComponentFixture<ServiceRecentInstancesCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ServiceRecentInstancesCardComponent,
        MetadataCardTestComponents,
        CompactServiceInstanceCardComponent,
        AppChipsComponent

      ],
      imports: generateCfBaseTestModulesNoShared(),
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
