import { ApplicationStateComponent } from '../application-state/application-state.component';
import { ApplicationStateIconComponent } from '../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../application-state/application-state-icon/application-state-icon.pipe';
import { TableCellComponent } from '../table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';
import { EntityInfo } from '../../../store/types/api.types';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsComponent } from './cards.component';
import { CardComponent } from './card/card.component';
import { CoreModule } from '../../../core/core.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { CardEntryPoints, TableCellEntryPoints } from '../../../test-framework/list-table-helper';
import { IListDataSource } from '../../data-sources/list-data-source-types';
import { CardStatusComponent } from '../card-status/card-status.component';
import { UsageGaugeComponent } from '../usage-gauge/usage-gauge.component';
import { PercentagePipe } from '../../pipes/percentage.pipe';
import { RunningInstancesComponent } from '../running-instances/running-instances.component';

describe('CardsComponent', () => {
  let component: CardsComponent<EntityInfo>;
  let fixture: ComponentFixture<CardsComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardsComponent,
        CardComponent,
        CardStatusComponent,
        TableCellComponent,
        ...CardEntryPoints,
        ...TableCellEntryPoints,
        EventTabActorIconPipe,
        ValuesPipe,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        UsageGaugeComponent,
        PercentagePipe,
        RunningInstancesComponent,
      ],
      imports: [
        CoreModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardsComponent);
    component = fixture.componentInstance;
    component.dataSource = {} as IListDataSource<EntityInfo>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
