import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { UtilsService } from '../../../../../../../../core/src/core/utils.service';
import { TableCellCfCellComponent } from './table-cell-cf-cell.component';

describe('TableCellCfCellComponent', () => {
  let component: TableCellCfCellComponent;
  let fixture: ComponentFixture<TableCellCfCellComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellCfCellComponent,
      ],
      imports: [
        CoreModule,
      ],
      providers: [
        UtilsService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellCfCellComponent>(TableCellCfCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
