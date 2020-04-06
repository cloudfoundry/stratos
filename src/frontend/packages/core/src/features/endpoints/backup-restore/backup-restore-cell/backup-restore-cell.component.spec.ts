import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupRestoreCellComponent } from './backup-restore-cell.component';

describe('BackupRestoreCellComponent', () => {
  let component: BackupRestoreCellComponent;
  let fixture: ComponentFixture<BackupRestoreCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupRestoreCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupRestoreCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
