import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { getBaseTestModulesNoShared } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../test-framework/cloud-foundry-space.service.mock';
import { TableCellRouteAppsAttachedComponent } from './table-cell-route-apps-attached.component';
import { CloudFoundrySpaceService } from '../../../../../../features/cloud-foundry/services/cloud-foundry-space.service';
describe('TableCellRouteAppsAttachedComponent', () => {
  let component: TableCellRouteAppsAttachedComponent;
  let fixture: ComponentFixture<TableCellRouteAppsAttachedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellRouteAppsAttachedComponent],
      imports: [...getBaseTestModulesNoShared],
      providers: [
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRouteAppsAttachedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
