import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { RunningInstancesComponent } from './running-instances.component';

describe('RunningInstancesComponent', () => {
  let component: RunningInstancesComponent;
  let fixture: ComponentFixture<RunningInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RunningInstancesComponent],
      imports: [
        ...generateCfStoreModules(),
        CoreModule,
      ],
      providers: [
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RunningInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
