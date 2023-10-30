import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {AppComponent} from './app.component';
import {AgentComponent} from './components/agent/agent.component';
import {CustomerComponent} from './components/customer/customer.component';
import {RoleComponent} from './components/role/role.component';

const appRoutes: Routes = [
  { path: 'agent', component: AgentComponent },
  { path: 'customer', component: CustomerComponent },
  { path: '', component: RoleComponent  },
];

@NgModule({
  declarations: [
    AppComponent,
    AgentComponent,
    RoleComponent,
    CustomerComponent
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
