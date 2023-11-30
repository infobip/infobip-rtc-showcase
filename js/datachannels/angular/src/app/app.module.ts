import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AppComponent} from './app.component';
import {ChatroomComponent} from './components/chatroom/chatroom.component';
import {CommonModule} from '@angular/common';
import { ReceivedMessageComponent } from './components/received-message/received-message.component';
import { SentMessageComponent } from './components/sent-message/sent-message.component';
import { ReceivedBroadcastComponent } from './components/received-broadcast/received-broadcast.component';

const appRoutes: Routes = [
  { path: '', component: ChatroomComponent  },
];

@NgModule({
  declarations: [
    AppComponent,
    ChatroomComponent,
    ReceivedMessageComponent,
    SentMessageComponent,
    ReceivedBroadcastComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: true}
    ),
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
