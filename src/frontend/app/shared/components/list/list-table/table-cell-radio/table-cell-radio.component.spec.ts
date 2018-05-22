import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRadioComponent } from './table-cell-radio.component';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import {
  EntityInfo,
  APIResource
} from '../../../../../store/types/api.types';
import { IListDataSource } from '../../data-sources-controllers/list-data-source-types';

describe('TableCellRadioComponent', () => {
  let component: TableCellRadioComponent<any>;
  let fixture: ComponentFixture<TableCellRadioComponent<any>>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [TableCellRadioComponent],
        imports: [CoreModule],
        providers: [
          { provide: ApplicationService, useClass: ApplicationServiceMock }
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRadioComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        metadata: {}
      }
    } as APIResource;
    component.dataSource = {} as IListDataSource<any>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
