import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicePlanPriceComponent } from '../../../../service-plan-price/service-plan-price.component';
import { TableCellAServicePlanPriceComponent } from './table-cell-service-plan-price.component';

describe('TableCellAServicePlanPriceComponent', () => {
  let component: TableCellAServicePlanPriceComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPriceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAServicePlanPriceComponent,
        ServicePlanPriceComponent
      ],
      imports: [
        StoreModule,
        CoreModule,
        generateCfStoreModules()
      ],
      providers: [
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAServicePlanPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
