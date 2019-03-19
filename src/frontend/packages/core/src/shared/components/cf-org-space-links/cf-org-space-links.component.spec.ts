import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfOrgSpaceLinksComponent } from './cf-org-space-links.component';

describe('CfOrgSpaceLinksComponent', () => {
  let component: CfOrgSpaceLinksComponent;
  let fixture: ComponentFixture<CfOrgSpaceLinksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CfOrgSpaceLinksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfOrgSpaceLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
