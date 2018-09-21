import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaaspSummaryComponent } from './caasp-summary.component';

describe('CaaspSummaryComponent', () => {
  let component: CaaspSummaryComponent;
  let fixture: ComponentFixture<CaaspSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaaspSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaaspSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
