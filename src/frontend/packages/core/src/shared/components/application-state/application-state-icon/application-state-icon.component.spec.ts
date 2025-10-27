import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ApplicationStateIconComponent } from './application-state-icon.component';

describe('ApplicationStateIconComponent', () => {
  let component: ApplicationStateIconComponent;
  let fixture: ComponentFixture<ApplicationStateIconComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ApplicationStateIconComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStateIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
