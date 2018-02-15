import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardKeyComponent } from './meta-card-key.component';
import { SharedModule } from '../../../../../shared.module';

describe('MetaCardKeyComponent', () => {
  let component: MetaCardKeyComponent;
  let fixture: ComponentFixture<MetaCardKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
