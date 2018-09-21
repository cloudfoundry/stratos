import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PodMemoryUsageComponent } from './pod-memory-usage.component';

describe('PodMemoryUsageComponent', () => {
  let component: PodMemoryUsageComponent;
  let fixture: ComponentFixture<PodMemoryUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PodMemoryUsageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PodMemoryUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
