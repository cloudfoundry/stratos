import { EndpointsListConfigService } from '../../list-configs/endpoints-list-config.service';
import { TableCellComponent } from '../table/table-cell/table-cell.component';
import { EventTabActorIconPipe } from '../table/custom-cells/table-cell-event-action/event-tab-actor-icon.pipe';
import { ValuesPipe } from '../../pipes/values.pipe';

import { CardComponent } from '../cards/card/card.component';
import { TableComponent } from '../table/table.component';
import { EntityInfo } from '../../../store/types/api.types';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent, ListConfig } from './list.component';
import { CoreModule } from '../../../core/core.module';
import { CardsComponent } from '../cards/cards.component';
import { async } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { Observable } from 'rxjs/Observable';
import { ListPagination, ListFilter, ListSort } from '../../../store/actions/list.actions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TableCellActionsComponent } from '../table/table-cell-actions/table-cell-actions.component';
import { CardAppComponent } from '../cards/custom-cards/card-app/card-app.component';
import { TableCellAppNameComponent } from '../table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import { TableCellEntryPoints, CardEntryPoints } from '../../../test-framework/list-table-helper';
import { ListActions } from '../../data-sources/list-data-source-types';

describe('ListComponent', () => {
  let component: ListComponent<EntityInfo>;
  let fixture: ComponentFixture<ListComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ListConfig, useClass: EndpointsListConfigService }
      ],
      declarations: [
        ...TableCellEntryPoints,
        ...CardEntryPoints,
        ListComponent,
        CardsComponent,
        CardComponent,
        TableCellComponent,
        EventTabActorIconPipe,
        ValuesPipe,
        TableComponent,
      ],
      imports: [
        CoreModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ]
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
