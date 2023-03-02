import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {AppComponent} from './app.component';
import {WebrtcCallComponent} from './components/webrtc-call/webrtc-call.component';
import {PhoneCallComponent} from './components/phone-call/phone-call.component';
import {RoomCallComponent} from './components/room-call/room-call.component';

const appRoutes: Routes = [
  { path: 'webrtc-call', component: WebrtcCallComponent },
  { path: 'phone-call', component: PhoneCallComponent },
  { path: 'room', component: RoomCallComponent },
  { path: '', pathMatch: 'full', redirectTo: 'webrtc-call' },
];

@NgModule({
  declarations: [
    AppComponent,
    PhoneCallComponent,
    WebrtcCallComponent,
    RoomCallComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true }
    )
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
