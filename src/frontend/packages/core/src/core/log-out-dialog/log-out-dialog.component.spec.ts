import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { TailwindDialogRef, MAT_DIALOG_DATA } from '@stratosui/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../test-framework/core-test.modules';
import { SharedModule } from '../../shared/shared.module';
import { CoreModule } from '../core.module';
import { RouteModule } from './../../app.routing';
import { LogOutDialogComponent } from './log-out-dialog.component';

describe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;
  let element: HTMLElement;
  let router: any;

  class TailwindDialogRefMock {
  }

  class DialogDataMock {
    data = '';
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TailwindDialogRef, useClass: TailwindDialogRefMock },
        { provide: MAT_DIALOG_DATA, useClass: DialogDataMock },
      ],
      imports: [
        CoreModule,
        RouterTestingModule,
        RouteModule,
        SharedModule,
        NoopAnimationsModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogOutDialogComponent);
    router = TestBed.inject(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate after countdown', fakeAsync(() => {
    const spy = vi.spyOn(router, 'navigate');

    component.data = {
      expiryDate: Date.now() + 1000,
    };
    fixture.detectChanges();
    component.ngOnDestroy();
    component.ngOnInit();

    expect(spy).not.toHaveBeenCalled();
    tick(1500);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(['/login/logout']);
  }));

  afterEach(() => {
    fixture.destroy();
  });
});
