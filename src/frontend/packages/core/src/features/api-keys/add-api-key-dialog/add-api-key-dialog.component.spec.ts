import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TailwindDialogRef } from '@stratosui/core';

import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { AddApiKeyDialogComponent } from './add-api-key-dialog.component';

describe('AddApiKeyDialogComponent', () => {
  let component: AddApiKeyDialogComponent;
  let fixture: ComponentFixture<AddApiKeyDialogComponent>;

  const mockDialogRef = {
    close: () => { }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        AddApiKeyDialogComponent
      ],
      providers: [
        {
          provide: TailwindDialogRef,
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
