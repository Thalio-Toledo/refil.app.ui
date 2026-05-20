import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BufferItem {
  id: number;
  thumbnail: string;
  name: string;
  type: 'png' | 'jpg' | 'gif' | 'webm';
  tags: string[];
  editTag?: string;
  blob?: Blob;
  mimeType?: string;
}

@Component({
  selector: 'app-video-trimmer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-trimmer.html',
  styleUrl: './video-trimmer.scss',
})
export class VideoTrimmer {
  @ViewChild('videoPlayer', { static: false }) videoPlayer?: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

  loaded = false;
  videoSrc?: string;
  videoTitle = '';
  videoAuthor = '';
  videoTagsInput = '';
  duration = 0;
  currentTime = 0;
  selectionStart = 0;
  selectionEnd = 0;
  frameFormat: 'png' | 'jpg' = 'png';
  animationFormat: 'gif' | 'webm' = 'gif';
  capturingAnimation = false;
  sessionBuffer: BufferItem[] = [];
  private nextId = 1;
  private currentUrl?: string;
  private static readonly GIF_WORKER_PATH = 'assets/gif.worker.js';

  get selectionStartPercent() {
    return this.duration ? (this.selectionStart / this.duration) * 100 : 0;
  }

  get selectionWidthPercent() {
    return this.duration ? ((this.selectionEnd - this.selectionStart) / this.duration) * 100 : 0;
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
  }

  onLoadedMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.duration = video.duration || 0;
    this.loaded = true;
    this.selectionStart = 0;
    this.selectionEnd = Math.min(3, this.duration);
    this.currentTime = 0;
    video.currentTime = 0;
  }

  onTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.currentTime = video.currentTime;
  }

  setPlayhead(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.currentTime = value;
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.currentTime = value;
    }
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

  async captureFrame() {
    if (!this.loaded) {
      return;
    }
    const thumbnail = this.captureThumbnail();
    const blob = await this.captureFrameBlob();
    const item: BufferItem = {
      id: this.nextId++,
      thumbnail,
      name: `frame-${this.nextId}.${this.frameFormat}`,
      type: this.frameFormat,
      tags: [],
      blob,
      mimeType: `image/${this.frameFormat}`,
    };
    this.sessionBuffer = [item, ...this.sessionBuffer];
  }

  async captureAnimation() {
    if (!this.loaded || this.capturingAnimation) {
      return;
    }

    this.capturingAnimation = true;
    const thumbnail = this.captureThumbnail();

    try {
      const blob = await (this.animationFormat === 'webm'
        ? this.captureSegmentWebM()
        : this.captureSegmentGif());

      const item: BufferItem = {
        id: this.nextId++,
        thumbnail,
        name: `animation-${this.nextId}.${this.animationFormat}`,
        type: this.animationFormat,
        tags: [],
        blob,
        mimeType: this.animationFormat === 'webm' ? 'video/webm' : 'image/gif',
      };
      this.sessionBuffer = [item, ...this.sessionBuffer];
    } finally {
      this.capturingAnimation = false;
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
      canvas.toBlob((blob) => resolve(blob ?? new Blob()), `image/${this.frameFormat}`, 0.92);
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

  private async captureSegmentGif(): Promise<Blob> {
    const GIF = await this.ensureGifLibLoaded();
    if (!GIF) {
      throw new Error('Biblioteca GIF não carregada.');
    }

    const video = await this.createHiddenVideo();
    try {
      await this.seekVideo(video, this.selectionStart);

      const sourceWidth = video.videoWidth || 640;
      const sourceHeight = video.videoHeight || 360;
      const width = Math.min(480, sourceWidth);
      const height = Math.round((width / sourceWidth) * sourceHeight);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas não suportado para GIF.');
      }

      const duration = Math.max(this.selectionEnd - this.selectionStart, 0.2);
      const fps = 8;
      const frameCount = Math.min(20, Math.max(1, Math.round(duration * fps)));
      const frameDelay = Math.round(1000 / fps);

      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: VideoTrimmer.GIF_WORKER_PATH,
        width,
        height,
        background: '#000000',
        debug: false,
      });

      for (let index = 0; index < frameCount; index += 1) {
        const time = this.selectionStart + (duration * index) / Math.max(frameCount - 1, 1);
        await this.seekVideo(video, time);
        ctx.drawImage(video, 0, 0, width, height);
        gif.addFrame(canvas, { copy: true, delay: frameDelay });
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        gif.on('finished', resolve);
        gif.on('abort', () => reject(new Error('Geração de GIF abortada.')));
        gif.on('error', reject);
        gif.render();
      });

      return blob;
    } finally {
      this.cleanupHiddenVideo(video);
    }
  }

  private async ensureGifLibLoaded(): Promise<any> {
    const win = window as any;
    if (win.GIF) {
      return win.GIF;
    }

    if (document.querySelector('script[data-gif-lib]')) {
      return new Promise<any>((resolve) => {
        const interval = window.setInterval(() => {
          if (win.GIF) {
            window.clearInterval(interval);
            resolve(win.GIF);
          }
        }, 50);
      });
    }

    return new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/gif.js';
      script.async = true;
      script.setAttribute('data-gif-lib', 'true');
      script.onload = () => {
        if (win.GIF) {
          resolve(win.GIF);
        } else {
          reject(new Error('GIF script carregado, mas objeto GIF não encontrado.'));
        }
      };
      script.onerror = () => reject(new Error('Falha ao carregar biblioteca GIF.'));
      document.body.appendChild(script);
    });
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
}
