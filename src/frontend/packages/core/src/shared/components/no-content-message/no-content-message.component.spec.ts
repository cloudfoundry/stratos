import { CoreModule } from '../../../core/core.module';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NoContentMessageComponent } from './no-content-message.component';

describe('NoContentMessageComponent', () => {
  let component: NoContentMessageComponent;
  let fixture: ComponentFixture<NoContentMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoContentMessageComponent);
    component = fixture.componentInstance;
    component.secondLine = {
      link: '',
      linkText: '',
      text: '',
    };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
