import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { BaseTestModules, BaseTestModulesNoShared } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from '../../../../features/services/services/services-wall.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { SelectServiceComponent } from './select-service.component';
import { CsiGuidsService } from '../csi-guids.service';
import { EntityMonitorFactory } from '../../../monitors/entity-monitor.factory.service';

describe('SelectServiceComponent', () => {
  let component: SelectServiceComponent;
  let fixture: ComponentFixture<SelectServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectServiceComponent],
      imports: [...BaseTestModulesNoShared],
      providers: [
        PaginationMonitorFactory,
        ServicesWallService,
        EntityServiceFactory,
        CsiGuidsService,
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
