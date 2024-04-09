import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MetaCardItemComponent } from './meta-card-item.component';
import { SharedModule } from '../../../../../shared.module';

describe('MetaCardItemComponent', () => {
  let component: MetaCardItemComponent;
  let fixture: ComponentFixture<MetaCardItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
