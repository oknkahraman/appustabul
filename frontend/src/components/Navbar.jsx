import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wrench, User, LogOut, Home, Briefcase, Bell, Upload } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <Wrench className="h-7 w-7 text-orange-600" />
          <span className="text-2xl font-bold text-gray-900">UstaBul</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            data-testid="nav-home-btn"
            variant="ghost"
            onClick={() => navigate('/')}
            className="hidden sm:flex"
          >
            <Home className="mr-2 h-4 w-4" />
            Ana Sayfa
          </Button>

          <Button
            data-testid="nav-jobs-btn"
            variant="ghost"
            onClick={() => navigate('/jobs')}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            İş İlanları
          </Button>

          {user && (
            <>
              <Button
                data-testid="nav-notifications-btn"
                variant="ghost"
                onClick={() => navigate('/notifications')}
                className="relative"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-testid="nav-user-menu" variant="outline" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'worker' ? 'Usta' : 'İşveren'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    data-testid="nav-dashboard"
                    onClick={() => {
                      if (user.role === 'worker') {
                        navigate('/worker');
                      } else if (user.role === 'employer') {
                        navigate('/employer');
                      }
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === 'worker' && (
                    <DropdownMenuItem
                      data-testid="nav-portfolio"
                      onClick={() => navigate(`/portfolio/${user.id}`)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Portfolyo
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    data-testid="nav-logout"
                    onClick={onLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && (
            <Button
              data-testid="nav-login-btn"
              onClick={() => navigate('/auth')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Giriş Yap
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
