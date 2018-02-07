import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellRadioComponent } from './table-cell-radio.component';
import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../shared.module';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';

describe('TableCellRadioComponent', () => {
  let component: TableCellRadioComponent<any>;
  let fixture: ComponentFixture<TableCellRadioComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellRadioComponent ],
      imports: [
        CoreModule,
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellRadioComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: null
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
