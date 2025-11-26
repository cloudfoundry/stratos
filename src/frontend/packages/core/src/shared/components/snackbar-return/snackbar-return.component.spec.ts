import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Store } from '@ngrx/store';
import { createBasicStoreModule } from '@test-framework/core-test.helper';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { MDAppModule } from '../../../core/md.module';
import { MAT_SNACK_BAR_DATA } from '../../services/tailwind-material-replacements';
import { SnackBarReturnComponent } from './snackbar-return.component';

describe('SnackBarReturnComponent', () => {
  let component: SnackBarReturnComponent;
  let fixture: ComponentFixture<SnackBarReturnComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        CoreTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        SnackBarReturnComponent,
      ],
      providers: [
        {
          provide: 'TailwindSnackBarRef',
          useValue: {
            dismiss: vi.fn()
          }
        },
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: { message: '', returnUrl: '' }
        },
        {
          provide: Store,
          useValue: {
            dispatch: vi.fn()
          }
        },
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnackBarReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
