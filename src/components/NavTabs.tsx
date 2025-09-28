"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

  const navigation = [
    { name: 'Progress', href: '/progress' },
    { name: 'Assignments', href: '/assignments' },
    { name: 'Detail', href: '/detail' },
    { name: 'Settings', href: '/settings' },
    { name: 'Scratchpad', href: '/scratchpad' },
  ];

function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-8" aria-label="Tabs">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export default NavTabs;
