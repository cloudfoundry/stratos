import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../core/core.module';
import { EntityInfo } from '../../../store/types/api.types';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { PercentagePipe } from '../../pipes/percentage.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';
import { ApplicationStateIconComponent } from '../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from '../application-state/application-state.component';
import { ApplicationStateService } from '../application-state/application-state.service';
import { CardStatusComponent } from '../cards/card-status/card-status.component';
import { RunningInstancesComponent } from '../running-instances/running-instances.component';
import { UsageGaugeComponent } from '../usage-gauge/usage-gauge.component';
import { CardComponent, listCards } from './list-cards/card/card.component';
import { CardsComponent } from './list-cards/cards.component';
import { listTableCells, TableCellComponent } from './list-table/table-cell/table-cell.component';
import { TableRowComponent } from './list-table/table-row/table-row.component';
import { TableComponent } from './list-table/table.component';
import { EventTabActorIconPipe } from './list-types/app-event/table-cell-event-action/event-tab-actor-icon.pipe';
import { EndpointsListConfigService } from './list-types/endpoint/endpoints-list-config.service';
import { ListComponent } from './list.component';
import { ListConfig } from './list.component.types';
import { SharedModule } from '../../shared.module';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';

describe('ListComponent', () => {
  let component: ListComponent<EntityInfo>;
  let fixture: ComponentFixture<ListComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ListConfig, useClass: EndpointsListConfigService },
        ApplicationStateService,
        PaginationMonitorFactory,
        EntityMonitorFactory
      ],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    component.columns = [];
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
