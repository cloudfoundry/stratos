import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupRestoreEndpointsComponent } from './backup-restore-endpoints.component';

describe('BackupRestoreEndpointsComponent', () => {
  let component: BackupRestoreEndpointsComponent;
  let fixture: ComponentFixture<BackupRestoreEndpointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupRestoreEndpointsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupRestoreEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
