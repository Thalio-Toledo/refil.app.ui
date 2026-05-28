import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

interface BufferItem {
  id: number;
  thumbnail: string;
  name: string;
  type: 'jpg' | 'webm';
  tags: string[];
  editTag?: string;
  blob?: Blob;
  mimeType?: string;
}

@Component({
  selector: 'app-video-trimmer',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './video-trimmer.html',
  styleUrl: './video-trimmer.scss',
})
export class VideoTrimmer {
  @ViewChild('videoPlayer', { static: false }) videoPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('timelineTrack', { static: false }) timelineTrack?: ElementRef<HTMLDivElement>;

  loaded = false;
  activeDrag: 'start' | 'end' | 'playhead' | null = null;
  private pointerMoveListener = this.onDocumentPointerMove.bind(this);
  private pointerUpListener = this.onDocumentPointerUp.bind(this);
  videoSrc?: string;
  videoTitle = '';
  videoAuthor = '';
  videoTagsInput = '';
  videoTags: string[] = [];
  duration = 0;
  currentTime = 0;
  selectionStart = 0;
  selectionEnd = 0;
  frameCaptureReady = false;
  animationCaptureReady = false;
  capturingFrame = false;
  capturingAnimation = false;
  sessionBuffer: BufferItem[] = [];
  private nextId = 1;
  private currentUrl?: string;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  get selectionStartPercent() {
    return this.duration ? (this.selectionStart / this.duration) * 100 : 0;
  }

  get selectionWidthPercent() {
    return this.duration ? ((this.selectionEnd - this.selectionStart) / this.duration) * 100 : 0;
  }

  get selectionEndPercent() {
    return this.duration ? (this.selectionEnd / this.duration) * 100 : 0;
  }

  get playheadPercent() {
    return this.duration ? (this.currentTime / this.duration) * 100 : 0;
  }

  openFilePicker() {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.loadVideo(file);
    input.value = '';
  }

  loadVideo(file: File) {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
    }
    this.currentUrl = URL.createObjectURL(file);
    this.videoSrc = this.currentUrl;
    this.loaded = false;
    this.currentTime = 0;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.frameCaptureReady = false;
    this.animationCaptureReady = false;
    this.capturingFrame = false;
    this.capturingAnimation = false;
  }

  onLoadedMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.duration = video.duration || 0;
    this.loaded = true;
    this.frameCaptureReady = this.isVideoReady(video);
    this.animationCaptureReady = this.isVideoReady(video);
    this.selectionStart = 0;
    this.selectionEnd = Math.min(3, this.duration);
    this.currentTime = 0;
    video.currentTime = 0;
  }

  onTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.currentTime = video.currentTime;
  }

  onVideoTagsInput(value: string) {
    if (!value.includes(',')) {
      this.videoTagsInput = value;
      return;
    }

    const parts = value.split(',');
    const nextTags = parts
      .slice(0, -1)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (nextTags.length) {
      this.videoTags = [...this.videoTags, ...nextTags];
    }

    this.videoTagsInput = parts.at(-1)?.trimStart() ?? '';
  }

  removeVideoTag(index: number) {
    this.videoTags = this.videoTags.filter((_, i) => i !== index);
  }

  setPlayhead(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.seekTo(value);
  }

  setSelectionStart(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    const minimum = Math.max(0, Math.min(value, this.selectionEnd - 0.04));
    this.selectionStart = minimum;
  }

  setSelectionEnd(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    const maximum = Math.min(this.duration, Math.max(value, this.selectionStart + 0.04));
    this.selectionEnd = maximum;
  }

  startRangeDrag(type: 'start' | 'end' | 'playhead', event: PointerEvent) {
    if (!this.loaded) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.activeDrag = type;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    this.updateTimelinePosition(event);
    document.addEventListener('pointermove', this.pointerMoveListener, { passive: false });
    document.addEventListener('pointerup', this.pointerUpListener);
    document.addEventListener('pointercancel', this.pointerUpListener);
  }

  movePlayheadFromTimeline(event: PointerEvent) {
    if (!this.loaded) {
      return;
    }

    this.activeDrag = 'playhead';
    this.updateTimelinePosition(event);
    this.activeDrag = null;
  }

  private onDocumentPointerMove(event: PointerEvent) {
    if (!this.activeDrag || !this.timelineTrack || !this.duration) {
      return;
    }

    event.preventDefault();
    this.updateTimelinePosition(event);
  }

  private updateTimelinePosition(event: PointerEvent) {
    if (!this.activeDrag || !this.timelineTrack || !this.duration) {
      return;
    }

    const rect = this.timelineTrack.nativeElement.getBoundingClientRect();
    const rawPercent = (event.clientX - rect.left) / rect.width;
    const clampedPercent = Math.min(Math.max(rawPercent, 0), 1);
    const value = clampedPercent * this.duration;

    if (this.activeDrag === 'start') {
      this.selectionStart = Math.min(Math.max(0, value), this.selectionEnd - 0.04);
      this.seekTo(this.selectionStart);
    } else if (this.activeDrag === 'end') {
      this.selectionEnd = Math.max(Math.min(this.duration, value), this.selectionStart + 0.04);
      this.seekTo(this.selectionEnd);
    } else {
      this.seekTo(value);
    }
  }

  private onDocumentPointerUp() {
    this.activeDrag = null;
    document.removeEventListener('pointermove', this.pointerMoveListener);
    document.removeEventListener('pointerup', this.pointerUpListener);
    document.removeEventListener('pointercancel', this.pointerUpListener);
  }

  async captureFrame() {
    if (!this.frameCaptureReady || this.capturingFrame) {
      return;
    }

    this.capturingFrame = true;

    try {
      const thumbnail = this.captureThumbnail();
      const blob = await this.captureFrameBlob();
      const item: BufferItem = {
        id: this.nextId++,
        thumbnail,
        name: `frame-${this.nextId}.jpg`,
        type: 'jpg',
        tags: [],
        blob,
        mimeType: 'image/jpeg',
      };
      this.sessionBuffer = [item, ...this.sessionBuffer];
    } finally {
      this.capturingFrame = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async captureAnimation() {
    if (!this.animationCaptureReady || this.capturingAnimation) {
      return;
    }

    this.capturingAnimation = true;
    const thumbnail = this.captureThumbnail();

    try {
      const blob = await this.captureSegmentWebM();

      const item: BufferItem = {
        id: this.nextId++,
        thumbnail,
        name: `animation-${this.nextId}.webm`,
        type: 'webm',
        tags: [],
        blob,
        mimeType: 'video/webm',
      };
      this.sessionBuffer = [item, ...this.sessionBuffer];
    } finally {
      this.capturingAnimation = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async captureFrameBlob(): Promise<Blob> {
    const video = this.videoPlayer?.nativeElement;
    if (!video) {
      return new Blob();
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new Blob();
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob ?? new Blob()), 'image/jpeg', 0.92);
    });
  }

  private async captureSegmentWebM(): Promise<Blob> {
    const video = await this.createHiddenVideo();
    try {
      await this.seekVideo(video, this.selectionStart);

      const stream = (video as any).captureStream?.(30);
      if (!stream) {
        throw new Error('Browser não suporta captureStream para WebM.');
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
        ? 'video/webm; codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm; codecs=vp8')
        ? 'video/webm; codecs=vp8'
        : 'video/webm';

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.onerror = () => reject(new Error('Falha ao gravar WebM.'));
      });

      recorder.start();
      await video.play().catch(() => undefined);

      await Promise.race([
        this.waitForSelectionEnd(video),
        this.delay((this.selectionEnd - this.selectionStart) * 1000 + 500),
      ]);

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }

      const blob = await finished;
      video.pause();
      return blob;
    } finally {
      this.cleanupHiddenVideo(video);
    }
  }

  private createHiddenVideo(): Promise<HTMLVideoElement> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = this.videoSrc || '';
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.style.position = 'fixed';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      document.body.appendChild(video);
      resolve(video);
    });
  }

  private cleanupHiddenVideo(video: HTMLVideoElement) {
    video.pause();
    video.src = '';
    if (video.parentNode) {
      video.parentNode.removeChild(video);
    }
  }

  private waitForEvent(element: HTMLVideoElement, eventName: string): Promise<Event> {
    return new Promise((resolve) => {
      const listener = (event: Event) => {
        element.removeEventListener(eventName, listener);
        resolve(event);
      };
      element.addEventListener(eventName, listener);
    });
  }

  private waitForSelectionEnd(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const handler = () => {
        if (video.currentTime >= this.selectionEnd - 0.02) {
          video.removeEventListener('timeupdate', handler);
          resolve();
        }
      };
      video.addEventListener('timeupdate', handler);
    });
  }

  private async seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
    const targetTime = Math.min(Math.max(time, 0), this.duration);
    if (Math.abs(video.currentTime - targetTime) < 0.02 && video.readyState >= 2) {
      return;
    }

    if (video.readyState < 2) {
      await this.waitForEvent(video, 'loadedmetadata');
    }

    video.currentTime = targetTime;
    if (Math.abs(video.currentTime - targetTime) < 0.02) {
      return;
    }

    await this.waitForEvent(video, 'seeked');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  addTag(item: BufferItem) {
    const tag = (item.editTag || '').trim();
    if (!tag) {
      return;
    }
    item.tags = [...item.tags, tag];
    item.editTag = '';
  }

  removeTag(item: BufferItem, index: number) {
    item.tags = item.tags.filter((_, i) => i !== index);
  }

  deleteItem(itemId: number) {
    this.sessionBuffer = this.sessionBuffer.filter((item) => item.id !== itemId);
  }

  downloadItem(item: BufferItem) {
    if (!item.blob) {
      return;
    }

    const url = URL.createObjectURL(item.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = item.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  formatTime(seconds: number) {
    if (!this.duration) {
      return '00:00.00';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centiseconds = Math.floor((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  private seekTo(seconds: number) {
    const value = Math.min(Math.max(seconds, 0), this.duration || seconds);
    this.currentTime = value;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.currentTime = value;
    }
  }

  private captureThumbnail() {
    const video = this.videoPlayer?.nativeElement;
    if (!video) {
      return '';
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  private isVideoReady(video?: HTMLVideoElement) {
    return !!video && video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0;
  }
}
