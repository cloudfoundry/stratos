import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { StratosStatus } from '@stratosui/store';
import { MDAppModule } from '../md.module';
import { StatefulIconComponent } from './stateful-icon.component';

describe('StatefulIconComponent', () => {
  let component: StatefulIconComponent;
  let fixture: ComponentFixture<StatefulIconComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({

      providers: [provideZonelessChangeDetection()],

      imports: [
        MDAppModule,
        StatefulIconComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]

    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatefulIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should icon based on state key', () => {
    component.state = StratosStatus.OK;
    // Setter calls markForCheck(), but we need detectChanges in zoneless mode
    fixture.detectChanges();

    expect(element.textContent).toContain('done');
  });

  it('should show spinner if state key is busy', () => {
    component.state = StratosStatus.BUSY;
    // Setter calls markForCheck(), but we need detectChanges in zoneless mode
    fixture.detectChanges();

    expect(element.querySelector('app-spinner')).toBeTruthy();
  });
});
