import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfAppPollComponent } from './cf-app-poll.component';


describe('CfAppPollComponent', () => {
  let component: CfAppPollComponent;
  let fixture: ComponentFixture<CfAppPollComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CfAppPollComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfAppPollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
