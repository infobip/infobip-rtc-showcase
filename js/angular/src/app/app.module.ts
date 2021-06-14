import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {AppComponent} from './app.component';
import {CallComponent} from './components/call/call.component';
import {ConferenceComponent} from './components/conference/conference.component';

const appRoutes: Routes = [
  { path: 'call', component: CallComponent },
  { path: 'conference', component: ConferenceComponent },
  { path: '', pathMatch: 'full', redirectTo: 'call' },
];

@NgModule({
  declarations: [
    AppComponent,
    CallComponent,
    ConferenceComponent
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
