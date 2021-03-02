import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoreModule } from '@stratosui/core';
import { EndpointModel } from '@stratosui/store';

import { TableCellEndpointCreatorComponent } from './table-cell-endpoint-creator.component';

describe('TableCellEndpointCreatorComponent', () => {
  let component: TableCellEndpointCreatorComponent;
  let fixture: ComponentFixture<TableCellEndpointCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableCellEndpointCreatorComponent ],
      imports: [
        CoreModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellEndpointCreatorComponent);
    component = fixture.componentInstance;
    component.row = {
      creator: {
        name: 'dummy'
      }
    } as EndpointModel;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
