import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../core/core.module';
import { PollingIndicatorComponent } from './polling-indicator.component';


describe('PollingIndicatorComponent', () => {
  let component: PollingIndicatorComponent;
  let fixture: ComponentFixture<PollingIndicatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PollingIndicatorComponent],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PollingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
