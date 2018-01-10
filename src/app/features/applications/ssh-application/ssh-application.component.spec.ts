import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SshApplicationComponent } from './ssh-application.component';

describe('SshApplicationComponent', () => {
  let component: SshApplicationComponent;
  let fixture: ComponentFixture<SshApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SshApplicationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
