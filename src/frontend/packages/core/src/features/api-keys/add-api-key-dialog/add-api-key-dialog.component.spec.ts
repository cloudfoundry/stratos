import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEmptyStoreModule } from '@test-framework/core-test.helper';
import { CoreModule } from '@stratosui/core';

import { AddApiKeyDialogComponent } from './add-api-key-dialog.component';

describe('AddApiKeyDialogComponent', () => {
  let component: AddApiKeyDialogComponent;
  let fixture: ComponentFixture<AddApiKeyDialogComponent>;

  const mockDialogRef = {
    close: () => { }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        createEmptyStoreModule(),
        AddApiKeyDialogComponent,
      ],
      providers: [
        {
          provide: 'TailwindDialogRef',
          useValue: mockDialogRef,
        },
        provideZonelessChangeDetection(),
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddApiKeyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
