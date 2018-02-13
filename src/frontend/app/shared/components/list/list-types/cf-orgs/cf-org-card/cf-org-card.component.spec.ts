import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfOrgCardComponent } from './cf-org-card.component';

describe('CfOrgCardComponent', () => {
  let component: CfOrgCardComponent;
  let fixture: ComponentFixture<CfOrgCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CfOrgCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfOrgCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
