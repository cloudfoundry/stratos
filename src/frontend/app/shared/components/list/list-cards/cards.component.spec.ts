import { ApplicationStateComponent } from '../../application-state/application-state.component';
import { ApplicationStateIconComponent } from '../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../application-state/application-state-icon/application-state-icon.pipe';
import {
  TableCellComponent,
  listTableCells
} from '../list-table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../list-types/app-event/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../../pipes/values.pipe';
import { EntityInfo } from '../../../../store/types/api.types';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsComponent } from './cards.component';
import { CardComponent, listCards } from './card/card.component';
import { CoreModule } from '../../../../core/core.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../store/reducers.module';
import { IListDataSource } from '../data-sources-controllers/list-data-source-types';
import { CardStatusComponent } from '../../cards/card-status/card-status.component';
import { UsageGaugeComponent } from '../../usage-gauge/usage-gauge.component';
import { PercentagePipe } from '../../../pipes/percentage.pipe';
import { RunningInstancesComponent } from '../../running-instances/running-instances.component';
import { MetadataItemComponent } from '../../metadata-item/metadata-item.component';

describe('CardsComponent', () => {
  let component: CardsComponent<EntityInfo>;
  let fixture: ComponentFixture<CardsComponent<EntityInfo>>;

  beforeEach(
    async(() => {
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
          RunningInstancesComponent,
          MetadataItemComponent
        ],
        imports: [CoreModule]
      }).compileComponents();
    })
  );

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
