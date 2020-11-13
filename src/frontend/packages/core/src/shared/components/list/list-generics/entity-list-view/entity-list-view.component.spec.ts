import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { STRATOS_ENDPOINT_TYPE, systemInfoEntityType } from '../../../../../../../store/src/helpers/stratos-entity-factory';
import { BaseTestModules } from '../../../../../../test-framework/core-test.helper';
import { EntityListViewComponent } from './entity-list-view.component';

describe('EntityListViewComponent', () => {
  let component: EntityListViewComponent;
  let fixture: ComponentFixture<EntityListViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityListViewComponent);
    component = fixture.componentInstance;
    component.config = {
      entityConfig: {
        entityType: systemInfoEntityType,
        endpointType: STRATOS_ENDPOINT_TYPE,
      },
    };
    expect(() => fixture.detectChanges()).toThrowError('List Error: stratosSystemInfo has no action builder for the getMultiple action.');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
