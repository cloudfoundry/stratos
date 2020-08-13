import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { endpointEntityType, stratosEntityFactory } from '../../../../../store/src/helpers/stratos-entity-factory';
import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { AppActionMonitorIconComponent } from './app-action-monitor-icon.component';

describe('AppActionMonitorIconComponent', () => {
  let component: AppActionMonitorIconComponent;
  let fixture: ComponentFixture<AppActionMonitorIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppActionMonitorIconComponent);
    component = fixture.componentInstance;
    component.id = '1';
    component.schema = stratosEntityFactory(endpointEntityType);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
