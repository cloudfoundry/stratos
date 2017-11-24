import { CNSISModel } from '../../../../../store/types/cnsis.types';
import { CoreModule } from '../../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardEndpointComponent } from './card-endpoint.component';

describe('CardEndpointComponent', () => {
  let component: CardEndpointComponent;
  let fixture: ComponentFixture<CardEndpointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CardEndpointComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardEndpointComponent);
    component = fixture.componentInstance;
    component.row = {
      api_endpoint: {}
    } as CNSISModel;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
