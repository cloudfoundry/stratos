import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompactServiceInstanceCardComponent } from './compact-service-instance-card.component';

describe('CompactServiceInstanceCardComponent', () => {
  let component: CompactServiceInstanceCardComponent;
  let fixture: ComponentFixture<CompactServiceInstanceCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompactServiceInstanceCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactServiceInstanceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
