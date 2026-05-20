export class ImageDTO {
  videoId?: string; 
  name?: string;
  url?: string;     
  file?: File;     

  constructor(init: Partial<ImageDTO>) {
    Object.assign(this, init)
  }
}
