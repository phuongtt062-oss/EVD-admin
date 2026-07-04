import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { APP_ROUTES } from './core/constants/app.constant';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AppHeaderComponent } from './shared/layout/app-header/app-header.component';
import { AppMenuComponent } from './shared/layout/app-menu/app-menu.component';
import { APP_MENU_ITEMS } from './core/constants/app.constant';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [RouterOutlet, ToastComponent, AppMenuComponent, AppHeaderComponent],
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);
  readonly menuItems = APP_MENU_ITEMS;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly showShell = computed(() => {
    const url = this.currentUrl();
    return !!this.auth.user() && !url.startsWith(APP_ROUTES.LOGIN);
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onLogout(): void {
    this.auth.logout();
    this.closeSidebar();
  }
}
