import { Routes } from '@angular/router';
import { Home } from './views/home/home';
import { authGuard } from './services/auth.guard';
import { ImageUploader } from './components/image-uploader/image-uploader';
import { VideoTrimmer } from './views/video-trimmer/video-trimmer';

export const routes: Routes = [
    {
      path: '',
      redirectTo: 'home',
      pathMatch: 'full'
    },
    {
      path: 'home',
      loadComponent: () =>
        import('./views/home/home').then(m => m.Home),
      canActivate: [authGuard]
    },
    {
      path:'upload',
      component:ImageUploader

    },
    {
      path:'video/trimmer',
      component:VideoTrimmer

    }
];
