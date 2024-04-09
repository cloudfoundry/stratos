import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CardProgressOverlayComponent } from './card-progress-overlay.component';
import { CoreModule } from '../../../core/core.module';

describe('CardProgressOverlayComponent', () => {
  let component: CardProgressOverlayComponent;
  let fixture: ComponentFixture<CardProgressOverlayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
      ],
      declarations: [ CardProgressOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardProgressOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
