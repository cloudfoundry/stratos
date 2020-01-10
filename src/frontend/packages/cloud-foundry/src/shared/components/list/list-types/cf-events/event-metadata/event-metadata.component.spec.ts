import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { ValuesPipe } from '../../../../../../../../core/src/shared/pipes/values.pipe';
import { EventMetadataComponent } from './event-metadata.component';

describe('EventMetadataComponent', () => {
  let component: EventMetadataComponent;
  let fixture: ComponentFixture<EventMetadataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventMetadataComponent, ValuesPipe],
      imports: [CoreModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventMetadataComponent);
    component = fixture.componentInstance;
    component.metadata = {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
