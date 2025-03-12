import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EnumerateComponent } from './enumerate.component';

describe('EnumerateComponent', () => {
  let component: EnumerateComponent;
  let fixture: ComponentFixture<EnumerateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EnumerateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnumerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
