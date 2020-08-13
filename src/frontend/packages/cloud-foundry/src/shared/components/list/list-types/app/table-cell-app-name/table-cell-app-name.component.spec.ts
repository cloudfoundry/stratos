import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ROUTER_NAVIGATION } from '@ngrx/router-store';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { TableCellAppNameComponent } from './table-cell-app-name.component';

describe('TableCellAppNameComponent', () => {
  let component: TableCellAppNameComponent<any>;
  let fixture: ComponentFixture<TableCellAppNameComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellAppNameComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        generateCfStoreModules()
      ]
    })
      .compileComponents();

    TestBed.get(Store).dispatch({
      type: ROUTER_NAVIGATION,
      payload: {
        event: {
          url: 'url'
        }
      }
    });


  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppNameComponent);
    component = fixture.componentInstance;
    component.row = { entity: {}, metadata: {} };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
