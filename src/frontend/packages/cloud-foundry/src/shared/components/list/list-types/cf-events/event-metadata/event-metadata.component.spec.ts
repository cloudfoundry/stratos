import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { ValuesPipe } from '../../../../../../../../core/src/shared/pipes/values.pipe';
import { EventMetadataComponent } from './event-metadata.component';

describe('EventMetadataComponent', () => {
  let component: EventMetadataComponent;
  let fixture: ComponentFixture<EventMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventMetadataComponent, ValuesPipe,
      imports: [CoreModule]
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
