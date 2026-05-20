import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom, Observable } from 'rxjs'

import { Video } from '../domain/video'
import { ImageDTO } from '../domain/dto/image-dto'

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly apiUrl = 'https://localhost:7224/api/Video'

  constructor(private readonly http: HttpClient) {}

  get(): Observable<Video[]> {
    return this.http.get<Video[]>(this.apiUrl)
  }

  findById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`)
  }

  async create(video: Video){
    return await firstValueFrom(this.http.post<Video>(`${this.apiUrl}`, video))
  }

  async addImage(dto: FormData){
    return  await firstValueFrom(this.http.post<boolean>(`${this.apiUrl}/add-images`, dto))
  }

  update(video: Video): Observable<boolean> {
    return this.http.put<boolean>(this.apiUrl, video)
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`)
  }
}
