import { CoreModule } from '../../../../core/core.module';
import { MDAppModule } from '../../../../core/md.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsTabComponent } from './events-tab.component';
import { SharedModule } from '../../../../shared/shared.module';

describe('EventsTabComponent', () => {
  let component: EventsTabComponent;
  let fixture: ComponentFixture<EventsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventsTabComponent],
      imports: [
        MDAppModule,
        SharedModule,
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
