import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../core/core.module';
import { EntitySummaryTitleComponent } from './entity-summary-title.component';
import { CloudFoundryPackageModule } from '../../../../../cloud-foundry/src/cloud-foundry.module';

describe('EntitySummaryTitleComponent', () => {
    let component: EntitySummaryTitleComponent;
    let fixture: ComponentFixture<EntitySummaryTitleComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                CloudFoundryPackageModule
            ],
            declarations: [EntitySummaryTitleComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EntitySummaryTitleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
