import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { LogOut, Users, Package, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, logout, signIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'orders', label: 'Pedidos', icon: Package },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Gestión de Pedidos</h1>
            <p className="text-muted-foreground">Inicia sesión para gestionar tus clientes y pedidos.</p>
          </div>
          <Button onClick={signIn} size="lg" className="w-full">
            Iniciar sesión con Google
          </Button>
          <div className="pt-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">AdminPanel</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-accent/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border/50">
              <img 
                src={user.photoURL || ''} 
                alt="" 
                className="h-6 w-6 rounded-full border border-background shadow-sm" 
                referrerPolicy="no-referrer" 
              />
              <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-[150px]">{user.displayName?.split(' ')[0]}</span>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors rounded-xl"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
