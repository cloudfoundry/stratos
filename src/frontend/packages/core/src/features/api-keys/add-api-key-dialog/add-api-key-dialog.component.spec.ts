import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { AddApiKeyDialogComponent } from './add-api-key-dialog.component';

describe('AddApiKeyDialogComponent', () => {
  let component: AddApiKeyDialogComponent;
  let fixture: ComponentFixture<AddApiKeyDialogComponent>;

  const mockDialogRef = {
    close: () => { }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
      ],
      declarations: [AddApiKeyDialogComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: mockDialogRef
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApiKeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
