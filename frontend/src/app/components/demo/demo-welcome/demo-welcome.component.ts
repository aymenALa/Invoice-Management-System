import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-demo-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-welcome.component.html'
})
export class DemoWelcomeComponent {
  @Input() visible = false;
  @Output() dismissed = new EventEmitter<void>();

  dismiss(): void {
    localStorage.setItem('ims_demo_welcome_dismissed', 'true');
    this.dismissed.emit();
  }
}
