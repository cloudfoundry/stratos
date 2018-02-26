import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetachServiceBindingComponent } from './detach-service-binding.component';

describe('DetachServiceBindingComponent', () => {
  let component: DetachServiceBindingComponent;
  let fixture: ComponentFixture<DetachServiceBindingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetachServiceBindingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetachServiceBindingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
