import { CoreModule } from '../../../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppComponent } from './card-app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { APIResourceMetadata } from '../../../../../store/types/api.types';

describe('CardAppComponent', () => {
  let component: CardAppComponent;
  let fixture: ComponentFixture<CardAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppComponent
      ],
      imports: [
        CoreModule,
        RouterTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        state: ''
      },
      metadata: {} as APIResourceMetadata,
    };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
