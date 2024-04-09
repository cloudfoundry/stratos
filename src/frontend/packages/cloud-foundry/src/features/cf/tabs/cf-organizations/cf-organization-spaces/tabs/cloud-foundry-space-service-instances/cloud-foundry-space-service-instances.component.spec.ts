import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { getCfSpaceServiceMock } from '../../../../../../../../test-framework/cloud-foundry-space.service.mock';
import {
  TableCellAppCfOrgSpaceHeaderComponent,
} from '../../../../../../../shared/components/list/list-types/app/table-cell-app-cforgspace-header/table-cell-app-cforgspace-header.component';
import { ServiceActionHelperService } from '../../../../../../../shared/data-services/service-action-helper.service';
import { CloudFoundrySpaceServiceInstancesComponent } from './cloud-foundry-space-service-instances.component';

@NgModule({
    declarations: [TableCellAppCfOrgSpaceHeaderComponent],
    imports: [CommonModule]
})
class EntryComponentModules { }

describe('CloudFoundrySpaceServiceInstancesComponent', () => {
  let component: CloudFoundrySpaceServiceInstancesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceServiceInstancesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceServiceInstancesComponent],
      imports: [
        ...generateCfBaseTestModules(),
        EntryComponentModules,
      ],
      providers: [getCfSpaceServiceMock, DatePipe, ServiceActionHelperService],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
