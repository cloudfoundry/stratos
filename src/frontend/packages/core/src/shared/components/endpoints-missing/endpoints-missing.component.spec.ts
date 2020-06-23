import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../shared.module';
import { EndpointsMissingComponent } from './endpoints-missing.component';

describe('EndpointsMissingComponent', () => {
  let component: EndpointsMissingComponent;
  let fixture: ComponentFixture<EndpointsMissingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        RouterTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsMissingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
