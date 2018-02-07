import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellAppRouteComponent } from './table-cell-app-route.component';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';

import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../../shared/shared.module';

describe('TableCellAppRouteComponent', () => {
  let component: TableCellAppRouteComponent<any>;
  let fixture: ComponentFixture<TableCellAppRouteComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellAppRouteComponent ],
      imports: [
        CoreModule,
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellAppRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
