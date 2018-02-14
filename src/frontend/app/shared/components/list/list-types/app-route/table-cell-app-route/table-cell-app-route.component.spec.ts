import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppRouteComponent } from './table-cell-app-route.component';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';

import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../../shared/shared.module';
import { combineAll } from 'rxjs/operators/combineAll';
import { APIResource } from '../../../../../../store/types/api.types';

describe('TableCellAppRouteComponent', () => {
  let component: TableCellAppRouteComponent<any>;
  let fixture: ComponentFixture<TableCellAppRouteComponent<any>>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [TableCellAppRouteComponent],
        imports: [CoreModule],
        providers: [
          { provide: ApplicationService, useClass: ApplicationServiceMock }
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppRouteComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {},
      metadata: {}
    } as APIResource;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
