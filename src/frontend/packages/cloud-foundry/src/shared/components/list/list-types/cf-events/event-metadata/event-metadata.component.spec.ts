import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { ValuesPipe } from '@stratosui/core';
import { EventMetadataComponent } from './event-metadata.component';

describe('EventMetadataComponent', () => {
  let component: EventMetadataComponent;
  let fixture: ComponentFixture<EventMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventMetadataComponent, ValuesPipe],
      providers: [provideZonelessChangeDetection()],
    })
      .compileComponents();

    fixture = TestBed.createComponent(EventMetadataComponent);
    component = fixture.componentInstance;
    component.metadata = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
