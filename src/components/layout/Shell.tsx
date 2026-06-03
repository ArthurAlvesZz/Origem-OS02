import { type ReactNode } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Factory, 
  Wallet, Users, FileText, Settings, Bell, Plus, Coffee, Briefcase, Layers, Server
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Page } from '../../App';

interface ShellProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'comercial', label: 'Comercial', icon: ShoppingCart },
  { id: 'clientes', label: 'Clientes / Parceiros', icon: Users },
  { id: 'crm', label: 'CRM / Auto', icon: Users },
  { id: 'assinaturas', label: 'Assinaturas', icon: Coffee },
  { id: 'catalogo', label: 'Catálogo', icon: Layers },
  { id: 'b2bcatalog', label: 'Catálogo B2B', icon: Briefcase },
  { id: 'consignacao', label: 'Consignação', icon: Briefcase },
  { id: 'estoque', label: 'Estoque', icon: Package },
  { id: 'producao', label: 'Produção', icon: Factory },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet },
  { id: 'rh', label: 'Equipe', icon: Users },
  { id: 'fiscal', label: 'Fiscal', icon: FileText },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
] as const;

export function Shell({ children, currentPage, onNavigate }: ShellProps) {
  // Top 5 items for mobile bottom nav
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row text-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 bg-zinc-950 border-r border-zinc-900 z-50">
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <div className="flex items-center gap-2 text-zinc-50">
            <div className="w-8 h-8 bg-zinc-50 rounded-md flex items-center justify-center">
              <span className="text-zinc-950 font-heading font-bold text-lg leading-none">G</span>
            </div>
            <span className="font-heading font-semibold text-lg tracking-tight">GestaoOS</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Gestão</div>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id as Page)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                currentPage === id 
                  ? "bg-zinc-800 text-zinc-50 font-medium" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
            >
              <Icon size={18} className={currentPage === id ? "text-zinc-50" : "text-zinc-400"} />
              {label}
            </button>
          ))}
          
          <div className="px-3 mt-8 mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Sistema</div>
          
          <button
            onClick={() => onNavigate('conexao')}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors hover:bg-zinc-900",
              currentPage === 'conexao' ? "bg-zinc-800 text-zinc-50 font-medium" : "text-zinc-400"
            )}
          >
            <div className="flex items-center gap-3">
              <Server size={18} className={currentPage === 'conexao' ? "text-zinc-50" : "text-zinc-400"} />
              Conexão
            </div>
            <div className={`w-2 h-2 rounded-full ${
               localStorage.getItem('DATA_MODE') === 'api' ? (localStorage.getItem('gestaoos_api_base_url') ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-zinc-500'
            }`} title="Status de conexão"></div>
          </button>
          
          <button
            onClick={() => onNavigate('config')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm transition-colors hover:bg-zinc-900 hover:text-zinc-100",
              currentPage === 'config' ? "bg-zinc-800 text-zinc-50 font-medium" : "text-zinc-400"
            )}
          >
            <Settings size={18} className={currentPage === 'config' ? "text-zinc-50" : "text-zinc-400"} />
            Configurações
          </button>
        </div>
        
        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-50">
              CF
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-zinc-50 leading-tight">COFCOF.CO</span>
              <span className="text-xs text-zinc-500">Plano Starter</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen pb-16 md:pb-0">
          {/* App Header */}
          <header className="h-[72px] bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900/80 sticky top-0 z-40 px-6 md:px-8 flex items-center justify-between transition-all">
            <h1 className="text-xl md:text-2xl font-heading font-medium text-zinc-50 tracking-tight capitalize">
              {currentPage === 'rh' ? 'Equipe' : currentPage.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-4">
              <button className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900 rounded-full transition-colors">
                <Bell size={20} className="stroke-[1.5]" />
                <span className="absolute top-2.5 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-zinc-950"></span>
              </button>
              <button className="hidden md:flex items-center gap-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
                <Plus size={18} className="stroke-[2]" />
                Nova Ação
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-x-hidden p-4 md:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-900 z-50 px-2 pb-safe-bottom pt-2 pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around">
            {mobileNavItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id as Page)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors rounded-xl",
                  currentPage === id ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon size={22} className={cn("stroke-[1.5]", currentPage === id && "stroke-[2]")} />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    );
  }
