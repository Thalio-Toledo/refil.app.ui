import { Image } from "./image"

export class Video {
  videoId?: string
  name: string
  author: string
  images: Image[] = []


  constructor(init: Partial<Video>) {
    Object.assign(this, init)
  }
}
