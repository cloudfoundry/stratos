import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppChipsComponent } from './chips.component';

describe('AppChipsComponent', () => {
  let component: AppChipsComponent;
  let fixture: ComponentFixture<AppChipsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppChipsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
