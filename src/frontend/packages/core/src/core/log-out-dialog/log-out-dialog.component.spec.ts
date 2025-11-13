import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LogOutDialogComponent } from './log-out-dialog.component';

describe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;
  let element: HTMLElement;
  let router: Router;

  class TailwindDialogRefMock extends TailwindDialogRef {
    close = vi.fn();
    afterClosed = vi.fn();
    afterOpened = vi.fn();
    componentInstance = null;
  }

  const dialogDataMock = {
    expiryDate: Date.now() + 5000
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        { provide: TailwindDialogRef, useClass: TailwindDialogRefMock },
        { provide: 'TailwindDialogRef', useClass: TailwindDialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: dialogDataMock },
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ],
      imports: [
        CommonModule,
        LogOutDialogComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogOutDialogComponent);
    router = TestBed.inject(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate after countdown', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(router, 'navigate');

    component.data = {
      expiryDate: Date.now() + 1000
    };
    fixture.detectChanges();
    component.ngOnDestroy();
    component.ngOnInit();

    expect(spy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(['/login/logout']);
    vi.useRealTimers();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
