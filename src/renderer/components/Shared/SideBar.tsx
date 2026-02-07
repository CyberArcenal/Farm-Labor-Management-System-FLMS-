// components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Trees,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  HelpCircle,
  CalendarDays,
  Users2,
  PieChart,
  User2,
  Receipt,
  BarChart2,
  DollarSign,
  ClipboardList,
  Sprout,
  Wheat,
  Package,
  TrendingUp, Activity,
  HistoryIcon
} from "lucide-react";
import dashboardAPI from "../../apis/dashboard";
import { kabAuthStore } from "../../lib/kabAuthStore";
import { dialogs } from "../../utils/dialogs";
import { version } from "../../../../package.json";


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

interface StatsData {
  activeCrops: number;
  activeWorkers: number;
  pendingTasks: number;
  todaysSales: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<StatsData>({
    activeCrops: 0,
    activeWorkers: 0,
    pendingTasks: 0,
    todaysSales: 0
  });
  const [loading, setLoading] = useState(true);

  const menuItems: MenuItem[] = [
    { path: "/", name: "Dashboard", icon: LayoutDashboard, category: "core" },
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
    {
      path: "/workers",
      name: "Workers",
      icon: Users,
      category: "core",
      children: [
        { path: "/workers/list", name: "Worker Directory", icon: Users2 },
        { path: "/workers/attendance", name: "Attendance", icon: CalendarDays },
      ],
    },
    {
      path: "/finance",
      name: "Payroll & Finance",
      icon: DollarSign,
      category: "core",
      children: [
        { path: "/finance/payments", name: "Payments", icon: DollarSign },
        { path: "/finance/debts", name: "Debt Management", icon: Receipt },
        {path: "/finance/history", name: "History", icon: HistoryIcon},
      ],
    },
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
    {
      path: "/system",
      name: "System",
      icon: Settings,
      category: "system",
      children: [
        { path: "/system/users", name: "User Management", icon: User2 },
        { path: "/system/sessions", name: "Session Management", icon: CalendarDays },
        { path: "/system/audit", name: "Audit Trail", icon: ClipboardList },
        {path: "system/settings", name: "Farm Management Settings", icon: Sprout},
      ],
    },
  ];

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch workers overview
      const workersResponse = await dashboardAPI.getWorkersOverview();
      const activeWorkers = workersResponse.data?.summary?.active || 0;
      
      // Fetch assignment overview
      const assignmentsResponse = await dashboardAPI.getAssignmentOverview();
      const activeAssignments = assignmentsResponse.data?.summary?.activeAssignments || 0;
      const pendingTasks = activeAssignments; // Use active assignments as pending tasks
      
      // Fetch bukid overview (for active crops)
      const bukidResponse = await dashboardAPI.getBukidOverview();
      const activeCrops = bukidResponse.data?.summary?.activeBukids || 0;
      
      // Fetch today's stats for sales
      const todayResponse = await dashboardAPI.getTodayStats();
      const todaysSales = todayResponse.data?.payments?.totalAmount || 0;

      setStats({
        activeCrops,
        activeWorkers,
        pendingTasks,
        todaysSales
      });
    } catch (error) {
      console.error("Error fetching sidebar stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 2 minutes
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, []);

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
    menuItems.forEach((item) => {
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
                    ? "bg-white text-[var(--accent-green-dark)] shadow-md"
                    : "text-white hover:bg-white/10"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${is_active
                      ? "text-[var(--accent-green-dark)]"
                      : "text-white group-hover:text-white"
                      }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${
                    is_active
                      ? "text-[var(--accent-green-dark)]"
                      : "text-white group-hover:text-white"
                  }`}
                />
              </div>

              {isOpen && (
                <ul className="ml-4 mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const isChildActive = isActivePath(child.path);
                    return (
                      <li key={child.path} className="mb-1">
                        <Link
                          to={child.path}
                          className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                            ${isChildActive
                              ? "bg-white/20 text-white border-l-2 border-white pl-3"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
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
                  ? "bg-white text-[var(--accent-green-dark)] shadow-md"
                  : "text-white hover:bg-white/10"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${is_active
                    ? "text-[var(--accent-green-dark)]"
                    : "text-white group-hover:text-white"
                    }`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-opacity duration-200 ${is_active
                  ? "opacity-100 text-[var(--accent-green-dark)]"
                  : "opacity-0 group-hover:opacity-100 text-white"
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

  const handleLogOut = async () => {
    const confirmed = await dialogs.confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
    });

    if (confirmed) {
      kabAuthStore.logout();
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div
      className={`fixed md:relative inset-y-0 left-0 w-64
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-all duration-300 ease-in-out
        z-30 flex flex-col h-screen shadow-xl`}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)'
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: 'white',
              color: 'var(--accent-green-dark)'
            }}
          >
            <Sprout className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: 'white' }}>
              Kabisilya
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Farm Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category === category.id,
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-6">
              <h6 className="px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-3"
                style={{
                  color: 'rgba(255,255,255,0.6)'
                }}
              >
                {category.name}
              </h6>
              <ul className="space-y-1">
                {renderMenuItems(categoryItems)}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'white' }}>
          {loading ? "Loading stats..." : "Quick Stats"}
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Package className="w-4 h-4 mx-auto mb-1" style={{ color: 'white' }} />
            <div className="text-lg font-bold" style={{ color: 'white' }}>
              {loading ? "..." : stats.activeCrops}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Active Bukid</div>
          </div>
          <div className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Users className="w-4 h-4 mx-auto mb-1" style={{ color: 'white' }} />
            <div className="text-lg font-bold" style={{ color: 'white' }}>
              {loading ? "..." : stats.activeWorkers}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Active Workers</div>
          </div>
          <div className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Activity className="w-4 h-4 mx-auto mb-1" style={{ color: 'white' }} />
            <div className="text-lg font-bold" style={{ color: 'white' }}>
              {loading ? "..." : stats.pendingTasks}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Active Assignments</div>
          </div>
          <div className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <TrendingUp className="w-4 h-4 mx-auto mb-1" style={{ color: 'white' }} />
            <div className="text-lg font-bold" style={{ color: 'white' }}>
              {loading ? "..." : formatCurrency(stats.todaysSales).replace('PHP', '₱')}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Today's Payments</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex justify-center gap-3 mb-3">
          <button
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Help"
            style={{ color: 'white' }}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <Link
            to="/system/settings"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Settings"
            style={{ color: 'white' }}
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={handleLogOut}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Logout"
            style={{ color: 'white' }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
          v{version} {new Date().getFullYear()} Kabisilya Management
        </p>
      </div>
    </div>
  );
};

export default Sidebar;