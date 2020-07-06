import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule } from '../../../../../../store/testing/public-api';
import { NoContentMessageComponent } from '../../no-content-message/no-content-message.component';
import { MaxListMessageComponent } from './max-list-message.component';

describe('MaxListMessageComponent', () => {
  let component: MaxListMessageComponent;
  let fixture: ComponentFixture<MaxListMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        MaxListMessageComponent,
        NoContentMessageComponent
      ],
      imports: [
        MatIconModule,
        RouterTestingModule,
        createBasicStoreModule()
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaxListMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
