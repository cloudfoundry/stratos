import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { StratosStatus } from '@stratosui/store';
import { CardStatusComponent } from './card-status.component';

describe('CardStatusComponent', () => {
  let component: CardStatusComponent;
  let fixture: ComponentFixture<CardStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ CardStatusComponent ],
      providers: [ provideZonelessChangeDetection() ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('paints the bar from a plain status', async () => {
    const element: HTMLElement = fixture.nativeElement;
    fixture.componentRef.setInput('status$', StratosStatus.ERROR);
    await fixture.whenStable();
    expect(element.querySelector('.bg-danger-shade-500')).toBeTruthy();

    fixture.componentRef.setInput('status$', null);
    await fixture.whenStable();
    expect(element.querySelector('div')).toBeFalsy();
  });
});
