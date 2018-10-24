import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardComponent } from './meta-card.component';
import { SharedModule } from '../../../../../shared.module';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';

describe('MetaCardComponent', () => {
  let component: MetaCardComponent;
  let fixture: ComponentFixture<MetaCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        createBasicStoreModule()
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
