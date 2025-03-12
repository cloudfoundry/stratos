import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { UtilsService } from '../../../../../../../../core/src/core/utils.service';
import { UsageGaugeComponent } from '../../../../../../../../core/src/shared/components/usage-gauge/usage-gauge.component';
import { PercentagePipe } from '../../../../../../../../core/src/shared/pipes/percentage.pipe';
import { EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { TableCellUsageComponent } from './table-cell-usage.component';

describe('TableCellUsageComponent', () => {
  let component: TableCellUsageComponent<EntityInfo>;
  let fixture: ComponentFixture<TableCellUsageComponent<EntityInfo>>;

  beforeEach(waitForAsync(() => {
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
