import { TableCellComponent } from '../table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { EntityInfo } from '../../../store/types/api.types';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsComponent } from './cards.component';
import { CardComponent } from './card/card.component';
import { CoreModule } from '../../../core/core.module';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { CardEntryPoints, TableCellEntryPoints } from '../../../test-framework/list-table-helper';
import { IListDataSource } from '../../data-sources/list=data-source-types';

describe('CardsComponent', () => {
  let component: CardsComponent<EntityInfo>;
  let fixture: ComponentFixture<CardsComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardsComponent,
        CardComponent,
        TableCellComponent,
        ...CardEntryPoints,
        ...TableCellEntryPoints,
        EventTabActorIconPipe,
        ValuesPipe,
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
