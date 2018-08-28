import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfEndpointsMissingComponent } from './cf-endpoints-missing.component';
import { CoreModule } from '../../../core/core.module';

import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { SharedModule } from '../../shared.module';


describe('CfEndpointsMissingComponent', () => {
  let component: CfEndpointsMissingComponent;
  let fixture: ComponentFixture<CfEndpointsMissingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        RouterTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointsMissingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
