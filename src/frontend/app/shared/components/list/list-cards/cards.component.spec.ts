import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../core/core.module';
import { EntityInfo } from '../../../../store/types/api.types';
import { PercentagePipe } from '../../../pipes/percentage.pipe';
import { ValuesPipe } from '../../../pipes/values.pipe';
import {
  ApplicationStateIconComponent,
} from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from '../../application-state/application-state.component';
import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { RunningInstancesComponent } from '../../running-instances/running-instances.component';
import { UsageGaugeComponent } from '../../usage-gauge/usage-gauge.component';
import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { listTableCells, TableCellComponent } from '../list-table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../list-types/app-event/table-cell-event-action/event-tab-actor-icon.pipe';
import { CardComponent, listCards } from './card/card.component';
import { CardsComponent } from './cards.component';
import { MetaCardModule } from './meta-card/meta-card.module';

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
        ...listCards,
        ...listTableCells,
        EventTabActorIconPipe,
        ValuesPipe,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        UsageGaugeComponent,
        PercentagePipe,
        RunningInstancesComponent
      ],
      imports: [
        CoreModule,
        MetaCardModule
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
