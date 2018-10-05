import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PodNameLinkComponent } from './pod-name-link.component';

describe('PodNameLinkComponent', () => {
  let component: PodNameLinkComponent;
  let fixture: ComponentFixture<PodNameLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PodNameLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PodNameLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
