import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { ServicePlanPriceComponent } from '../../../../service-plan-price/service-plan-price.component';
import { TableCellAServicePlanPriceComponent } from './table-cell-service-plan-price.component';

describe('TableCellAServicePlanPriceComponent', () => {
  let component: TableCellAServicePlanPriceComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPriceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAServicePlanPriceComponent,
        ServicePlanPriceComponent
      ],
      imports: [
        StoreModule,
        CoreModule,
        createBasicStoreModule()
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
