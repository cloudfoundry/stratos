import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '../../../core/core.module';
import { EntityInfo } from '../../../store/types/api.types';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { SharedModule } from '../../shared.module';
import { ApplicationStateService } from '../application-state/application-state.service';
import { EndpointsListConfigService } from './list-types/endpoint/endpoints-list-config.service';
import { ListComponent } from './list.component';
import { ListConfig } from './list.component.types';


describe('ListComponent', () => {
  let component: ListComponent<EntityInfo>;
  let fixture: ComponentFixture<ListComponent<EntityInfo>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ListConfig, useClass: EndpointsListConfigService },
        ApplicationStateService,
        PaginationMonitorFactory,
        EntityMonitorFactory
      ],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<ListComponent<EntityInfo>>(ListComponent);
    component = fixture.componentInstance;
    component.columns = [];
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
