import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellUsageComponent } from './table-cell-usage.component';
import { EntityInfo } from '../../../../../store/types/api.types';
import { UsageGaugeComponent } from '../../../usage-gauge/usage-gauge.component';
import { PercentagePipe } from '../../../../pipes/percentage.pipe';
import { UtilsService } from '../../../../../core/utils.service';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';

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
    fixture = TestBed.createComponent(TableCellUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
