import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoHelperComponent } from './demo-helper.component';

describe('DemoHelperComponent', () => {
  let component: DemoHelperComponent;
  let fixture: ComponentFixture<DemoHelperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DemoHelperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoHelperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
