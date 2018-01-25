import { CoreModule } from '../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RunningInstancesComponent } from './running-instances.component';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';

describe('RunningInstancesComponent', () => {
  let component: RunningInstancesComponent;
  let fixture: ComponentFixture<RunningInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RunningInstancesComponent],
      imports: [
        CoreModule,
        createBasicStoreModule(),
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
