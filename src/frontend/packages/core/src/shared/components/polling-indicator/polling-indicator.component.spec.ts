import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PollingIndicatorComponent } from './polling-indicator.component';


describe('PollingIndicatorComponent', () => {
  let component: PollingIndicatorComponent;
  let fixture: ComponentFixture<PollingIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PollingIndicatorComponent]
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
