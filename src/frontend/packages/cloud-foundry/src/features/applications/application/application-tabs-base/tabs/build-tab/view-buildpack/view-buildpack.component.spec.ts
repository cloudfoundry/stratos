import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ViewBuildpackComponent } from './view-buildpack.component';

describe('ViewBuildpackComponent', () => {
  let component: ViewBuildpackComponent;
  let fixture: ComponentFixture<ViewBuildpackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ ViewBuildpackComponent ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewBuildpackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
