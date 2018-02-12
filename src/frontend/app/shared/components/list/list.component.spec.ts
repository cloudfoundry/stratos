import { ApplicationStateComponent } from '../application-state/application-state.component';
import { ApplicationStateIconComponent } from '../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateService } from '../application-state/application-state.service';
import { EndpointsListConfigService } from './list-types/endpoint/endpoints-list-config.service';
import { TableCellComponent, listTableCells } from './list-table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from './list-types/app-event/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';

import { CardComponent, listCards } from './list-cards/card/card.component';
import { TableComponent } from './list-table/table.component';
import { EntityInfo } from '../../../store/types/api.types';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent } from './list.component';
import { CoreModule } from '../../../core/core.module';
import { CardsComponent } from './list-cards/cards.component';
import { async } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { Observable } from 'rxjs/Observable';
import { ListPagination, ListFilter, ListSort } from '../../../store/actions/list.actions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TableCellActionsComponent } from './list-table/table-cell-actions/table-cell-actions.component';
import { ListActions } from './data-sources-controllers/list-data-source-types';
import { CardStatusComponent } from '../cards/card-status/card-status.component';
import { UsageGaugeComponent } from '../usage-gauge/usage-gauge.component';
import { PercentagePipe } from '../../pipes/percentage.pipe';
import { TableRowComponent } from './list-table/table-row/table-row.component';
import { RunningInstancesComponent } from '../running-instances/running-instances.component';
import { ListConfig } from './list.component.types';

describe('ListComponent', () => {
  let component: ListComponent<EntityInfo>;
  let fixture: ComponentFixture<ListComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ListConfig, useClass: EndpointsListConfigService },
        ApplicationStateService
      ],
      declarations: [
        ...listTableCells,
        ...listCards,
        ListComponent,
        CardsComponent,
        CardComponent,
        CardStatusComponent,
        TableCellComponent,
        EventTabActorIconPipe,
        ValuesPipe,
        TableComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        UsageGaugeComponent,
        PercentagePipe,
        TableRowComponent,
        RunningInstancesComponent,
      ],
      imports: [
        CoreModule,
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
    component.paginator.pageSizeOptions = [];
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
