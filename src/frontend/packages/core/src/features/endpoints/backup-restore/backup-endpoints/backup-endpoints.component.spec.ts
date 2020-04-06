import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupEndpointsComponent } from './backup-endpoints.component';

describe('BackupEndpointsComponent', () => {
  let component: BackupEndpointsComponent;
  let fixture: ComponentFixture<BackupEndpointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupEndpointsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
