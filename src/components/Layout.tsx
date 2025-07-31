import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  ChartPie, 
  Settings,
  Calendar,
  Target,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import FilterTanggalGlobal from './FilterTanggalGlobal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transaksi', icon: FileText, label: 'Transaksi' },
    { path: '/kategori', icon: FolderOpen, label: 'Kategori' },
    { path: '/laporan', icon: ChartPie, label: 'Laporan' },
    { path: '/target', icon: Target, label: 'Target' },
    { path: '/pengaturan', icon: Settings, label: 'Pengaturan' }
  ];

  const NavLink = ({ item, onClick }: { item: typeof navItems[0], onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-md transform scale-[0.98]'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[0.98]'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-blue-600 shadow-lg lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white">Gajiku</h1>
            </div>
            
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-6 bg-gradient-to-r from-emerald-500 to-blue-600 text-white">
                  <SheetTitle className="text-white flex items-center space-x-3">
                    <Calendar className="h-6 w-6" />
                    <span>Gajiku</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-4 space-y-2">
                  {navItems.map((item) => (
                    <NavLink 
                      key={item.path} 
                      item={item} 
                      onClick={() => setSidebarOpen(false)} 
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Mobile Date Filter */}
          <div className="mt-3 -mx-1">
            <FilterTanggalGlobal />
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-blue-600 shadow-lg hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Gajiku</h1>
            </div>
            
            {/* Desktop Filter */}
            <FilterTanggalGlobal />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm p-4 sticky top-8">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-4 sm:space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <nav className="flex justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-20"></div>
    </div>
  );
};

export default Layout;
