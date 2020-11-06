import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { createBasicStoreModule } from '../../../../../../store/testing/public-api';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { CoreModule, SharedModule } from '../../../../public-api';
import { HomePageEndpointCardComponent } from './home-page-endpoint-card.component';

describe('HomePageEndpointCardComponent', () => {
  let component: HomePageEndpointCardComponent;
  let fixture: ComponentFixture<HomePageEndpointCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomePageEndpointCardComponent ],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule()
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePageEndpointCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
