import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../test-framework/core-test.helper';
import { endpointEntitySchema } from '../../../../../base-entity-schemas';
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
      endpointGuid: '',
      entityConfig: endpointEntitySchema,
    };
    expect(() => fixture.detectChanges()).toThrowError('List Error: stratosEndpoint has no action builder for the getMultiple action.');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
