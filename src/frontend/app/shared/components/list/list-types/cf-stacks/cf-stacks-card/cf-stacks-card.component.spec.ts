import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfStacksCardComponent } from './cf-stacks-card.component';

describe('CfStacksCardComponent', () => {
  let component: CfStacksCardComponent;
  let fixture: ComponentFixture<CfStacksCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CfStacksCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfStacksCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
