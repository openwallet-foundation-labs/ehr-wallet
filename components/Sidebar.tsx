import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Share, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Wallet 
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    return router.pathname.startsWith(path);
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/patient/dashboard',
      active: isActive('/patient/dashboard')
    },
    {
      title: 'Share Data',
      icon: <Share className="h-5 w-5" />,
      href: '/patient/share-data',
      active: isActive('/patient/share-data')
    },
    {
      title: 'Access Logs',
      icon: <ClipboardList className="h-5 w-5" />,
      href: '/patient/access-logs',
      active: isActive('/patient/access-logs')
    },
    {
      title: 'Connect Wallet',
      icon: <Wallet className="h-5 w-5" />,
      href: '/patient/wallet',
      active: isActive('/patient/wallet')
    },
    {
      title: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/patient/settings',
      active: isActive('/patient/settings')
    }
  ];

  return (
    <div className="w-64 bg-card h-screen flex flex-col border-r">
      <div className="p-6">
        <h2 className="text-xl font-bold">Patient Portal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {session?.user?.name || 'Welcome back'}
        </p>
      </div>
      
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto border-t">
        <button
          onClick={() => router.push('/api/auth/signout')}
          className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
