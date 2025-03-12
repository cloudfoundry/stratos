
import { CoreModule } from '../../../../../core/core.module';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CardComponent, listCards } from './card.component';
import { SharedModule } from '../../../../shared.module';
import { EntityInfo } from '../../../../../../../store/src/types/api.types';

describe('CardComponent', () => {
  let component: CardComponent<EntityInfo>;
  let fixture: ComponentFixture<CardComponent<EntityInfo>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent<CardComponent<EntityInfo>>(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
