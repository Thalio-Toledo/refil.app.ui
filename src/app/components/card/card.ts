import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-card',
  imports: [ButtonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {}
