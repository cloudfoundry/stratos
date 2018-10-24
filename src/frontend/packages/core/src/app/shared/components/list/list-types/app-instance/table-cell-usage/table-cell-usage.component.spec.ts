import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../core/core.module';
import { UtilsService } from '../../../../../../core/utils.service';
import { EntityInfo } from '../../../../../../store/types/api.types';
import { PercentagePipe } from '../../../../../pipes/percentage.pipe';
import { UsageGaugeComponent } from '../../../../usage-gauge/usage-gauge.component';
import { TableCellUsageComponent } from './table-cell-usage.component';

describe('TableCellUsageComponent', () => {
  let component: TableCellUsageComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellUsageComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellUsageComponent,
        UsageGaugeComponent,
        PercentagePipe,
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
    fixture = TestBed.createComponent<TableCellUsageComponent<EntityInfo>>(TableCellUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
