import {
  AlertTriangle,
  BarChart3,
  MapPin,
  FileText,
  TrendingUp,
  Database,
  Info,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";

const menuItems = [
  { id: "anomali", label: "Anomali", icon: AlertTriangle },
  { id: "grafik", label: "Grafik", icon: BarChart3 },
  { id: "peta", label: "Peta", icon: MapPin },
  { id: "hasil-ubinan", label: "Hasil Ubinan", icon: FileText },
  { id: "grafik-ubinan", label: "Grafik Hasil Ubinan", icon: TrendingUp },
  { id: "database-petani", label: "Database Petani", icon: Database },
  { id: "fenomena", label: "Fenomena", icon: Newspaper },
  { id: "petunjuk-teknis", label: "Petunjuk Teknis", icon: Info },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  user?: string;
  onLogout?: () => void;
}

export function Sidebar({ activeSection, onSectionChange, collapsed, onToggle, user, onLogout }: SidebarProps) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300"
      style={{
        width: collapsed ? 72 : 260,
        background: "var(--gradient-sidebar)",
        boxShadow: "var(--shadow-sidebar)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border/30">
        <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-slide-in-left">
            <h1 className="text-base font-bold text-sidebar-foreground">Daun Padi</h1>
            <p className="text-[11px] text-sidebar-foreground/50">Dashboard Anomali</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`sidebar-link w-full ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User & Logout */}
      {user && !collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border/30 flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/70 font-medium">User: {user}</span>
          {onLogout && (
            <button onClick={onLogout} className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors underline">
              Logout
            </button>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-4 border-t border-sidebar-border/30 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
