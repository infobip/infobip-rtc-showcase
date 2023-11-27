import {Component, Input} from '@angular/core';
import {Message} from "../../types/message";
import {getDateString} from "../../utils/date-util";

@Component({
  selector: 'app-sent-message',
  templateUrl: './sent-message.component.html'
})
export class SentMessageComponent {
  @Input() message!: Message

  getPrimaryText(): string {
    return `${this.message.text} (${this.message?.status})`
  }

  getSecondaryText(): string {
    return `(You) at ${getDateString(this.message)} ${this.message.to ? `(Direct to ${this.message?.to})` : ''}`
  }
}
