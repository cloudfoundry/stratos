import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MDAppModule } from '../../../core/md.module';
import { LoadingPageComponent } from './loading-page.component';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { SharedModule } from '../../shared.module';

describe('LoadingPageComponent', () => {
  let component: LoadingPageComponent;
  let fixture: ComponentFixture<LoadingPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        SharedModule,
        createBasicStoreModule()
      ],
      providers: [
        EntityMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
