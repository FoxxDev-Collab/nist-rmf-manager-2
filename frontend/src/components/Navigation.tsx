import { FC } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  FilePlus,
  FileText,
  Home,
  AlertTriangle,
  Target,
  Building,
  Settings,
  Menu,
  X
} from 'lucide-react'

interface NavigationProps {
  isOpen: boolean
  toggle: () => void
}

const Navigation: FC<NavigationProps> = ({ isOpen, toggle }) => {
  const pathname = usePathname();
  const assessmentId = pathname.includes('/assessment/') 
    ? pathname.split('/assessment/')[1]?.split('/')[0] 
    : null;

  const links = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <Home className="mr-2 h-4 w-4" />
    },
    {
      href: '/clients',
      label: 'Clients',
      icon: <Building className="mr-2 h-4 w-4" />
    }
  ];

  if (assessmentId) {
    links.push(
      {
        href: `/assessment/${assessmentId}`,
        label: 'Assessment',
        icon: <FileText className="mr-2 h-4 w-4" />
      },
      {
        href: `/assessment/${assessmentId}/risk`,
        label: 'Risks',
        icon: <AlertTriangle className="mr-2 h-4 w-4" />
      },
      {
        href: `/assessment/${assessmentId}/objective`,
        label: 'Objectives',
        icon: <Target className="mr-2 h-4 w-4" />
      }
    );
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="absolute left-4 top-3 md:hidden" 
        onClick={toggle}
        size="icon"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-screen flex-col">
          <div className="p-6">
            <h2 className="text-2xl font-bold tracking-tight">RMF Manager</h2>
          </div>
          <div className="flex-1 space-y-1 p-4">
            {links.map((link) => (
              <Button
                key={link.href}
                variant={pathname === link.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  pathname === link.href 
                    ? "" 
                    : pathname.startsWith(link.href + "/") && "bg-muted"
                )}
                asChild
              >
                <Link href={link.href}>
                  {link.icon}
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={toggle}
        />
      )}
    </>
  )
}

export default Navigation 