import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoTrimmer } from './video-trimmer';

describe('VideoTrimmer', () => {
  let component: VideoTrimmer;
  let fixture: ComponentFixture<VideoTrimmer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoTrimmer],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoTrimmer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
