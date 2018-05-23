import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from '../../../services/services/services-wall.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { SelectServiceComponent } from './select-service.component';
import { CsiGuidsService } from '../csi-guids.service';

describe('SelectServiceComponent', () => {
  let component: SelectServiceComponent;
  let fixture: ComponentFixture<SelectServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectServiceComponent],
      imports: [...BaseTestModules],
      providers: [
        PaginationMonitorFactory,
        ServicesWallService,
        EntityServiceFactory,
        CreateServiceInstanceHelperService,
        CsiGuidsService
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
