import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupConnectionCellComponent } from './backup-connection-cell.component';

describe('BackupConnectionCellComponent', () => {
  let component: BackupConnectionCellComponent;
  let fixture: ComponentFixture<BackupConnectionCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BackupConnectionCellComponent,
      ],
      imports: [
        ...BaseTestModulesNoShared
      ],
      providers: [
        BackupEndpointsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupConnectionCellComponent);
    component = fixture.componentInstance;
    component.row = {
      guid: 'test',
      cnsi_type: 'metrics',
    } as EndpointModel;
    component.service.initialize([{
      guid: 'test'
    } as EndpointModel]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
