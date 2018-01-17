import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationTabsBaseComponent } from './application-tab-base.component';

describe('ApplicationTabBaseComponent', () => {
  let component: ApplicationTabsBaseComponent;
  let fixture: ComponentFixture<ApplicationTabsBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationTabsBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationTabsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
