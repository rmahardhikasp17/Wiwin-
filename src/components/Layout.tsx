import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  ChartPie, 
  Settings,
  Calendar,
  Target,
  Menu,
  X,
  MoreHorizontal,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import FilterTanggalGlobal from './FilterTanggalGlobal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transaksi', icon: FileText, label: 'Transaksi' },
    { path: '/kategori', icon: FolderOpen, label: 'Kategori' },
    { path: '/laporan', icon: ChartPie, label: 'Laporan' },
    { path: '/target', icon: Target, label: 'Target' },
    { path: '/pengaturan', icon: Settings, label: 'Pengaturan' }
  ];

  // Get current page index for swipe navigation
  const getCurrentPageIndex = () => {
    return navItems.findIndex(item => item.path === location.pathname);
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = getCurrentPageIndex();
      if (currentIndex < navItems.length - 1) {
        // Add subtle haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        navigate(navItems[currentIndex + 1].path);
      }
    },
    onSwipedRight: () => {
      const currentIndex = getCurrentPageIndex();
      if (currentIndex > 0) {
        // Add subtle haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        navigate(navItems[currentIndex - 1].path);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
    delta: 60, // Minimum swipe distance
    swipeDuration: 500, // Maximum swipe duration
    touchEventOptions: { passive: false },
  });

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

  const MobileNavItem = ({ item, isVisible = true }: { item: typeof navItems[0], isVisible?: boolean }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    if (!isVisible) return null;

    return (
      <Link
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex flex-col items-center space-y-0.5 sm:space-y-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[80px] ${
          isActive
            ? 'text-emerald-600 bg-emerald-50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        <span className="text-xs font-medium text-center truncate w-full leading-tight">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-blue-600 shadow-lg lg:hidden flex-shrink-0">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white">Gajiku</h1>
            </div>

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
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
          <div className="mt-2 sm:mt-3 -mx-1">
            <FilterTanggalGlobal />
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-blue-600 shadow-lg hidden lg:block flex-shrink-0">
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

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8 gap-3 sm:gap-4 lg:gap-6">
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

        {/* Main Content with Swipe Support */}
        <main className="flex-1 min-w-0 overflow-x-hidden" {...swipeHandlers}>
          <div className="space-y-3 sm:space-y-4 lg:space-y-6 pb-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
        {/* Main Bottom Navigation */}
        <div className="px-2 sm:px-4 py-1.5 sm:py-2">
          <nav className="flex justify-between items-center">
            {/* First 4 navigation items */}
            <div className="flex justify-around flex-1 gap-1">
              {navItems.slice(0, 4).map((item) => (
                <MobileNavItem key={item.path} item={item} />
              ))}
            </div>

            {/* More menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex flex-col items-center space-y-0.5 sm:space-y-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 ${
                mobileMenuOpen
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {mobileMenuOpen ? (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="text-xs font-medium">Lainnya</span>
            </button>
          </nav>
        </div>

        {/* Popup Menu for Additional Items */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3"
            >
              <div className="flex justify-around gap-1">
                {navItems.slice(4).map((item) => (
                  <MobileNavItem key={item.path} item={item} />
                ))}
              </div>

              {/* Swipe hint */}
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  💡 Geser kiri/kanan untuk berpindah halaman
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-16 sm:h-20 flex-shrink-0"></div>
    </div>
  );
};

export default Layout;
