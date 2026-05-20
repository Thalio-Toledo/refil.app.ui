import { Component, inject, OnInit, signal } from '@angular/core';
import { FileUploadEvent, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { VideoService } from '../../services/video.service';
import { Video } from '../../domain/video';
import { Image } from '../../domain/image';

interface UploadEvent {
    originalEvent: Event;
    files: File[];
}

@Component({
  selector: 'app-image-uploader',
  imports: [FileUploadModule, ToastModule, CardModule, ReactiveFormsModule, IftaLabelModule, InputTextModule, ButtonModule, ChipModule  ],
  templateUrl: './image-uploader.html',
  styleUrl: './image-uploader.scss',
  providers:[MessageService]
})
export class ImageUploader implements OnInit{
  form!: FormGroup;
  private messageService = inject(MessageService);
  uploadedFiles: any[] = [];
  tags:string[] = []
  tag:string

  loading = signal(false);
  selectedFiles: File[] = [];

  constructor(private fb: FormBuilder, private videoService: VideoService){}

  ngOnInit(): void {
    this.initForm()
  }

  initForm(){
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      author: ['', [Validators.required, Validators.minLength(2)]],
      tag: ['']
    })
  }

  addTag() {
    this.loading.set(true);

    setTimeout(() => {
        this.loading.set(false);
        let tag = this.form.get('tag').value as string
        if(tag.length > 0 ) this.tags.push(tag)
        this.form.get('tag').setValue('')
    }, 500);
  }


  onFileSelect(event: any) {
    this.selectedFiles = event.currentFiles; 
    console.log(event, 'ev')
    console.log(this.selectedFiles, 'ev2')

  }

  async save(){
    let video = {
      name : this.form.get('name').value,
      author: this.form.get('author').value,
      } as Video

    video = await this.videoService.create(video)

    const formData = new FormData();

    formData.append('VideoId', video.videoId);

    this.selectedFiles.forEach(file => {
      formData.append('Files', file);
    });

    await this.videoService.addImage(formData)
  }
}
