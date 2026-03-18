import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TieredMenuModule } from 'primeng/tieredmenu';

@Component({
  selector: 'app-home',
  imports: [ButtonModule, TieredMenuModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
   darkMode = false;
   filters: MenuItem[]  = [
      {
        label: 'Transition',
      },
      {
          label: 'Easing',
      },
      {
          label: 'Technique',
      },
      {
          label: 'Style',
      },
      {
          label: 'Framerate',
      },
      {
          label: 'Aspect Ratio',
      },
      {
          label: 'Software',
      },
   ]

   configs :MenuItem[] = [
      {
        label: 'Help',
        icon:'pi pi-question-circle'
      },
      {
        label: 'Feedback',
        icon:'pi pi-comment'
      },
      {
        label: 'Terms',
        icon:'pi pi-hammer'
      },
      {
        label: 'Privacy',
        icon:'pi pi-shield'
      },
      {
        label: 'Theme',
        icon:  'pi pi-sun',
        command: ()=> this.toggleTheme()
      },
   ]

 

  toggleTheme() {
    const html = document.documentElement;
    this.darkMode = !this.darkMode

    if (this.darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    this.configs[ this.configs.length -1].icon = this.darkMode ?  'pi pi-sun': 'pi pi-moon'
  }
}
