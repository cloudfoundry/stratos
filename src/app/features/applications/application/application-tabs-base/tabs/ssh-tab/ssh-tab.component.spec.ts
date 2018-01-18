import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SshTabComponent } from './ssh-tab.component';

describe('SshTabComponent', () => {
  let component: SshTabComponent;
  let fixture: ComponentFixture<SshTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SshTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
