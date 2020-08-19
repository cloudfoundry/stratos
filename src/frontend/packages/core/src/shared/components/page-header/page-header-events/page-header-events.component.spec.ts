import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeaderEventsComponent } from './page-header-events.component';
import { SharedModule } from '../../../shared.module';
import { StoreModule } from '@ngrx/store';
import { RouterTestingModule } from '@angular/router/testing';
import { InternalEventMonitorFactory } from '@stratosui/store';

describe('PageHeaderEventsComponent', () => {
  let component: PageHeaderEventsComponent;
  let fixture: ComponentFixture<PageHeaderEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [InternalEventMonitorFactory],
      imports: [
        SharedModule,
        StoreModule.forRoot({}),
        RouterTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageHeaderEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
