import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { createBasicStoreModule } from '../../../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../../shared.module';
import { MetaCardComponent } from './meta-card.component';

describe('MetaCardComponent', () => {
  let component: MetaCardComponent;
  let fixture: ComponentFixture<MetaCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        StoreModule,
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
