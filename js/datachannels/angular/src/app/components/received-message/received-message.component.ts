import {Component, Input} from '@angular/core';
import {Message} from "../../types/message";
import {getDateString} from "../../utils/date-util";

@Component({
  selector: 'app-received-message',
  templateUrl: './received-message.component.html'
})
export class ReceivedMessageComponent {
  @Input() message!: Message

  getPrimaryText(): string {
    return this.message.text;
  }

  getSecondaryText(): string {
    return `From ${this.message.from} at ${getDateString(this.message)} ${this.message.isDirect ? '(Direct)' : ''}`
  }
}
