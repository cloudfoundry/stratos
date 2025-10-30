import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { createBasicStoreModule } from '../../../../../../store/testing/public-api';
import { NoContentMessageComponent } from '../../no-content-message/no-content-message.component';
import { MaxListMessageComponent } from './max-list-message.component';

describe('MaxListMessageComponent', () => {
  let component: MaxListMessageComponent;
  let fixture: ComponentFixture<MaxListMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        createBasicStoreModule(),
        MaxListMessageComponent,
        NoContentMessageComponent
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
