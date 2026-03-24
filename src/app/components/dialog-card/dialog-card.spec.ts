import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCard } from './dialog-card';

describe('DialogCard', () => {
  let component: DialogCard;
  let fixture: ComponentFixture<DialogCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCard],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
