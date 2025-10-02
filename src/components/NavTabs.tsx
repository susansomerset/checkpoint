"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

  const navigation = [
    { name: 'Progress', href: '/progress' },
    { name: 'Assignments', href: '/assignments' },
    { name: 'Detail', href: '/detail' },
  ];

function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center space-x-2" aria-label="Tabs">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              relative inline-flex items-center whitespace-nowrap px-4 py-2 rounded-md font-medium text-sm
              transition-colors duration-200 z-10
              ${isActive
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
