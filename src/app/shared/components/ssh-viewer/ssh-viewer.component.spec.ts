import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SshViewerComponent } from './ssh-viewer.component';

describe('SshViewerComponent', () => {
  let component: SshViewerComponent;
  let fixture: ComponentFixture<SshViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SshViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
