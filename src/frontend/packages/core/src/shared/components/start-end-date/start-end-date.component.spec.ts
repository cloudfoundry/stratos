import { SharedModule } from './../../shared.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartEndDateComponent } from './start-end-date.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StartEndDateComponent', () => {
  let component: StartEndDateComponent;
  let fixture: ComponentFixture<StartEndDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartEndDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
