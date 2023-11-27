import {Component, Input} from '@angular/core';
import {Message} from "../../types/message";
import {getDateString} from "../../utils/date-util";

@Component({
  selector: 'app-received-broadcast',
  templateUrl: './received-broadcast.component.html'
})
export class ReceivedBroadcastComponent {
  @Input() message!: Message

  getPrimaryText(): string {
    return this.message.text;
  }

  getSecondaryText(): string {
    return `(Broadcast) at ${getDateString(this.message)}`
  }
}
