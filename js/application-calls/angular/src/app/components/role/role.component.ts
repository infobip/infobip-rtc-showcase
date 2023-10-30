import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html'
})
export class RoleComponent {
  constructor(private router: Router) {}

  loginCustomer() {
    this.router.navigate(['/customer']);
  }

  loginAgent() {
    this.router.navigate(['/agent']);
  }
}
