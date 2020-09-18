import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { ValuesPipe } from '../../../../../../../../core/src/shared/pipes/values.pipe';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CfEvent } from '../../../../../../cf-api.types';
import { EventMetadataComponent } from '../event-metadata/event-metadata.component';
import { TableCellEventDetailComponent } from './table-cell-event-detail.component';

describe('TableCellEventDetailComponent', () => {
  let component: TableCellEventDetailComponent;
  let fixture: ComponentFixture<TableCellEventDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableCellEventDetailComponent, ValuesPipe, EventMetadataComponent],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<TableCellEventDetailComponent>(TableCellEventDetailComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        metadata: {}
      }
    } as APIResource<CfEvent>;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
