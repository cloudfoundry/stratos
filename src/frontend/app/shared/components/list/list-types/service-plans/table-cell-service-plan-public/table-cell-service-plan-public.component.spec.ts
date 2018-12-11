import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { ServicesService } from '../../../../../../features/service-catalog/services.service';
import { ServicesServiceMock } from '../../../../../../features/service-catalog/services.service.mock';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { ServicePlanPublicComponent } from '../../../../service-plan-public/service-plan-public.component';
import { TableCellAServicePlanPublicComponent } from './table-cell-service-plan-public.component';

describe('TableCellAServicePlanPublicComponent', () => {
  let component: TableCellAServicePlanPublicComponent;
  let fixture: ComponentFixture<TableCellAServicePlanPublicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TableCellAServicePlanPublicComponent,
        ServicePlanPublicComponent
      ],
      imports: [
        StoreModule,
        CoreModule,
        createBasicStoreModule()
      ],
      providers: [
        EntityMonitorFactory,
        { provide: ServicesService, useClass: ServicesServiceMock },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAServicePlanPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
