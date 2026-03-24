import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogCard } from '../dialog-card/dialog-card';

@Component({
  selector: 'app-card',
  imports: [ButtonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  providers:[DialogService]
})
export class Card {
  constructor(public dialogService: DialogService){
    
  }
  ref: DynamicDialogRef | undefined;

  openDialog() {
    this.ref = this.dialogService.open(DialogCard, {
        width: '60vw',
        // height: '60vw',
        modal: true,
        closable:true,
        dismissableMask: true,
        breakpoints: {
            '960px': '75vw',
            '640px': '90vw'
        },
    });
  }
}
