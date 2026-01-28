// components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { version } from "../../../../package.json";
import {
  LayoutDashboard,
  Trees,
  Users,
  Settings,
  ChevronDown,
  ChevronRight, Bell,
  LogOut,
  HelpCircle, ListChecks,
  CalendarDays,
  Users2,
  PieChart,
  User2,
  Receipt,
  BarChart2, DollarSign,
  ClipboardList, Sprout, Wheat,
  Shield
} from "lucide-react";
import { useSystemInfo } from "../../contexts/SystemInfoContext";
import { dialogs } from "../../utils/dialogs";
import { kabAuthStore } from "../../lib/kabAuthStore";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  category?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { systemInfo } = useSystemInfo();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    // Dashboard
    { path: "/", name: "Dashboard", icon: LayoutDashboard, category: "core" },

    // Bukid & Pitak Management
    {
      path: "/farms",
      name: "Bukid & Pitak",
      icon: Trees,
      category: "core",
      children: [
        { path: "/farms/bukid", name: "Mga Bukid", icon: Trees },
        { path: "/farms/pitak", name: "Mga Pitak", icon: Wheat },
        { path: "/farms/assignments", name: "Assignments", icon: ClipboardList },
      ],
    },

    // Kabisilya & Workers
    {
      path: "/workers",
      name: "Kabisilya & Workers",
      icon: Users,
      category: "core",
      children: [
        { path: "/workers/kabisilya", name: "Mga Kabisilya", icon: Sprout },
        { path: "/workers/list", name: "Worker Directory", icon: Users2 },
        { path: "/workers/attendance", name: "Attendance", icon: CalendarDays },
      ],
    },

    // Payroll & Finance
    {
      path: "/finance",
      name: "Payroll & Finance",
      icon: DollarSign,
      category: "core",
      children: [
        { path: "/finance/payments", name: "Payments", icon: DollarSign },
        { path: "/finance/debts", name: "Debt Management", icon: Receipt },
        // { path: "/finance/history", name: "Payment History", icon: ClipboardList },
      ],
    },

    // Reports & Analytics
    {
      path: "/analytics",
      name: "Reports & Analytics",
      icon: BarChart2,
      category: "analytics",
      children: [
        { path: "/analytics/bukid", name: "Bukid Reports", icon: PieChart },
        { path: "/analytics/pitak", name: "Pitak Productivity", icon: Wheat },
        { path: "/analytics/finance", name: "Financial Reports", icon: DollarSign },
        { path: "/analytics/workers", name: "Worker Performance", icon: Users },
      ],
    },

    // System
    {
      path: "/system",
      name: "System",
      icon: Settings,
      category: "system",
      children: [
        { path: "/system/users", name: "User Management", icon: User2 },
        { path: "/system/audit", name: "Audit Trail", icon: ListChecks },
        { path: "/system/notifications", name: "Notifications", icon: Bell },
        { path: "/system/backup", name: "Backup & Restore", icon: Shield },
      ],
    },
  ]);

  const filteredMenu = menuItems
    .map((item) => {
      // If a parent has children, filter its children array
      if (item.children) {
        const children = item.children.filter(
          (child) => !(child.path === "/users"),
        );
        return { ...item, children };
      }
      return item;
    })
    // Remove any parent with no visible route & no children
    .filter(
      (item) =>
        item.path !== "/users" && // top-level Users
        (item.children ? item.children.length > 0 : true),
    );

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const isDropdownActive = (items: MenuItem[] = []) => {
    return items.some((item) => isActivePath(item.path));
  };

  // Auto-open dropdown if current path matches a child
  useEffect(() => {
    filteredMenu.forEach((item) => {
      if (item.children && isDropdownActive(item.children)) {
        setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const is_active = hasChildren
        ? isDropdownActive(item.children)
        : isActivePath(item.path);
      const isOpen = openDropdowns[item.name];

      return (
        <li key={item.path || item.name} className="mb-1">
          {hasChildren ? (
            <>
              <div
                onClick={() => toggleDropdown(item.name)}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
            ${is_active
                    ? "bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-green-hover)] text-white shadow-lg"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                  }
          `}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${is_active
                      ? "text-white"
                      : "text-[var(--sidebar-text)] group-hover:text-white"
                      }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                    } ${is_active
                      ? "text-white"
                      : "text-[var(--sidebar-text)] group-hover:text-white"
                    }`}
                />
              </div>

              {isOpen && (
                <ul
                  className="ml-4 mt-1 space-y-1 border-l-2 pl-3"
                  style={{ borderColor: "var(--accent-green)" }}
                >
                  {item.children?.map((child) => {
                    const isChildActive = isActivePath(child.path);
                    return (
                      <li key={child.path} className="mb-1">
                        <Link
                          to={child.path}
                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                      ${isChildActive
                              ? "text-white bg-[var(--accent-green)]/20 font-semibold border-l-2 border-[var(--accent-green)] pl-2"
                              : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                            }
                    `}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <Link
              to={item.path}
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200
          ${is_active
                  ? "bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-green-hover)] text-white shadow-lg"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                }
        `}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${is_active
                    ? "text-white"
                    : "text-[var(--sidebar-text)] group-hover:text-white"
                    }`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-opacity duration-200 ${is_active
                  ? "opacity-100 text-white"
                  : "opacity-0 group-hover:opacity-50 text-[var(--sidebar-text)]"
                  }`}
              />
            </Link>
          )}
        </li>
      );
    });
  };

  const categories = [
    { id: "core", name: "Core Modules" },
    { id: "analytics", name: "Analytics & Reports" },
    { id: "system", name: "System" },
  ];

  const handleLogOut = async (event: any) => {
    const confirm = await dialogs.confirm({
      title: "Log-out?",
      message: "Are you sure do you want to logout?",
    });
    if (!confirm) return;
    kabAuthStore.logout();
  };

  return (
    <div
      className={`fixed md:relative inset-y-0 left-0 w-64
        bg-gradient-to-b from-[var(--sidebar-bg)] to-[#1a472a] border-r border-[var(--sidebar-border)]
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-all duration-300 ease-in-out
        z-30 flex flex-col h-screen shadow-xl`}
    >
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 border-b border-[var(--sidebar-border)] bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1a472a] p-6">
        <div className="flex items-center gap-3">
          {/* Logo container */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-green)] to-[#38a169] flex items-center justify-center overflow-hidden shadow-lg">
            <div className="flex items-center justify-center w-full h-full">
              <Sprout className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Business info */}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">
              {systemInfo ? systemInfo.site_name : `Kabisilya Management`}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Farm Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable area */}
      <nav className="flex-1 overflow-y-auto kabisilya-scrollbar p-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category === category.id,
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-6">
              <h6 className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider bg-[#1a472a]/50 rounded-lg">
                {category.name}
              </h6>
              <ul className="space-y-1 mt-2">
                {renderMenuItems(categoryItems)}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Quick Status Indicators */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[#1a472a]/30">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[var(--status-planted-bg)] text-[var(--status-planted)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">0</div>
            <div className="text-[10px]">Active Crops</div>
          </div>
          <div className="bg-[var(--status-growing-bg)] text-[var(--status-growing)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">0</div>
            <div className="text-[10px]">Active Workers</div>
          </div>
          <div className="bg-[var(--status-irrigation-bg)] text-[var(--accent-sky)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">0</div>
            <div className="text-[10px]">Pending Tasks</div>
          </div>
          <div className="bg-[var(--status-harvested-bg)] text-[var(--status-harvested)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">₱0.00</div>
            <div className="text-[10px]">Today's Sales</div>
          </div>
        </div>
        {/* <div className="flex justify-center">
          <Link
            to="/crops/kabisilya"
            className="w-full bg-gradient-to-r from-[var(--accent-green)] to-[#38a169] text-white text-sm py-2 px-4 rounded-lg text-center hover:from-[var(--accent-green-hover)] hover:to-[#2a623d] transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <Sprout className="w-4 h-4" />
            New Planting
          </Link>
        </div> */}
      </div>

      {/* Footer - Fixed height */}
      <div className="p-4 border-t border-[var(--border-color)] text-center flex-shrink-0 bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1a472a]">
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          v{version} • © {new Date().getFullYear()} Kabisilya
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="text-[var(--text-tertiary)] hover:text-[var(--accent-earth)] hover:bg-[var(--accent-earth)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <Link
            to="/system"
            className="text-[var(--text-tertiary)] hover:text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogOut}
            className="text-[var(--text-tertiary)] hover:text-[var(--accent-rust)] hover:bg-[var(--accent-rust)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;