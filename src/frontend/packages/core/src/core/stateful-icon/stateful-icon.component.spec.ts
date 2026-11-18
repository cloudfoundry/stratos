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

  beforeEach(async () => {
    fixture = TestBed.createComponent(StatefulIconComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should icon based on state key', async () => {
    fixture.componentRef.setInput('state', StratosStatus.OK);
    await fixture.whenStable();

    expect(element.textContent).toContain('done');
  });

  // The icon is the only sign of the state, so it is an image with a name.
  it('names the state for assistive technology', async () => {
    fixture.componentRef.setInput('state', StratosStatus.ERROR);
    await fixture.whenStable();
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Error');
  });

  it('should show spinner if state key is busy', async () => {
    fixture.componentRef.setInput('state', StratosStatus.BUSY);
    await fixture.whenStable();

    expect(element.querySelector('app-busy')).toBeTruthy();
  });
});
