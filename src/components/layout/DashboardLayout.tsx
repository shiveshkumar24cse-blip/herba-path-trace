import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Leaf, 
  LogOut, 
  User, 
  Settings, 
  Package, 
  FlaskConical, 
  Factory, 
  QrCode,
  Shield,
  BarChart3
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const roleIcons = {
  farmer: Leaf,
  wild_collector: Leaf,
  aggregator: Package,
  lab: FlaskConical,
  factory: Factory,
  consumer: QrCode,
  admin: Shield,
};

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const RoleIcon = roleIcons[profile.role] || User;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold text-primary">HerbalTrace</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-border" />
              <div className="hidden md:flex items-center space-x-2">
                <RoleIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {profile.role.replace('_', ' ')} Portal
                </span>
              </div>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {profile.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {profile.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <RoleIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}