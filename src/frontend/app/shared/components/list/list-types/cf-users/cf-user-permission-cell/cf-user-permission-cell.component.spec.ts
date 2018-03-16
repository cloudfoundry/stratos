import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellCfUserPermissionComponent } from './cf-user-permission-cell.component';
import {
  BaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SharedModule } from '../../../../../shared.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';

describe('CfUserPermissionCellComponent', () => {
  let component: TableCellCfUserPermissionComponent;
  let fixture: ComponentFixture<TableCellCfUserPermissionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        ...generateTestCfEndpointServiceProvider()
      ],
      imports: [
        SharedModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellCfUserPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
