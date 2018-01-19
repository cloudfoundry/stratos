import { CoreModule } from '../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationStateComponent } from '../../../../shared/components/application-state/application-state.component';
import {
  ApplicationStateIconComponent
} from '../../../../shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe
} from '../../../../shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { CardComponent } from './card.component';
import { EntityInfo } from '../../../../store/types/api.types';
import { TableCellComponent } from '../../table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../../pipes/values.pipe';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../store/reducers.module';
import { TableCellEntryPoints, CardEntryPoints } from '../../../../test-framework/list-table-helper';
import { CardStatusComponent } from '../../card-status/card-status.component';

describe('CardComponent', () => {
  let component: CardComponent<EntityInfo>;
  let fixture: ComponentFixture<CardComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardComponent,
        CardStatusComponent,
        ...CardEntryPoints,
        TableCellComponent,
        ...TableCellEntryPoints,
        EventTabActorIconPipe,
        ValuesPipe,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: [
        CoreModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
