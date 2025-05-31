// src/layouts/DashboardLayout.tsx
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  Users,
  Settings,
  Menu,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Genel',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Ürünler', href: '/items', icon: Package },
      { title: 'Kategoriler', href: '/categories', icon: LayoutGrid },
      { title: 'Öneriler', href: '/recommendations', icon: Users }, // Recommendations sayfası eklendi
    ],
  },
  {
    title: 'Ayarlar',
    items: [{ title: 'Ayarlar', href: '/settings', icon: Settings }],
  },
  {
    title: 'Çıkış Yap',
    items: [{ title: 'Çıkış Yap', href: '/login', icon: LogOut }],
  },
];

const UserNav: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="#" alt="User" />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Admin
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Çıkış Yap</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NavLink: React.FC<{
  href: string;
  icon: React.ElementType;
  title: string;
  isActive: boolean;
  onClick?: () => void;
}> = ({ href, icon: Icon, title, isActive, onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
      isActive && 'bg-muted text-primary'
    )}
  >
    <Icon className="h-4 w-4" />
    {title}
  </Link>
);

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span className="">Nappsa Panel</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((section) =>
                section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    title={item.title}
                    isActive={isActive(item.href)}
                  />
                ))
              )}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Package className="h-6 w-6" />
                  <span>Nappsa Panel</span>
                </Link>
                {navItems.map((section) =>
                  section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      title={item.title}
                      isActive={isActive(item.href)}
                      onClick={() => setMobileMenuOpen(false)}
                    />
                  ))
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1" />
          <UserNav />
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;