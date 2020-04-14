import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupConnectionCellComponent } from './backup-connection-cell.component';

describe('BackupConnectionCellComponent', () => {
  let component: BackupConnectionCellComponent;
  let fixture: ComponentFixture<BackupConnectionCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupConnectionCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupConnectionCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
