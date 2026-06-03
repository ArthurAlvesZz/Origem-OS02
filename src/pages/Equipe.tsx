import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { useRepositories } from '../repositories/RepositoryProvider';
import { TeamMember, Role, Permission, Invitation, AuditLog } from '../repositories/interfaces/ITeamRepository';
import { Users, UserPlus, Shield, Activity, Fingerprint, Search, Edit2, Lock, ListFilter, MapPin, Mail, Loader2, Ban, CheckCircle2 } from 'lucide-react';

type Tab = 'members' | 'invitations' | 'roles' | 'permissions' | 'audit';

export function Equipe() {
  const { teamRepo, actualType } = useRepositories();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [isLoading, setIsLoading] = useState(true);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'members') {
        const res = await teamRepo.getMembers();
        setMembers(res);
      } else if (activeTab === 'roles') {
        const res = await teamRepo.getRoles();
        setRoles(res);
      } else if (activeTab === 'permissions') {
        const res = await teamRepo.getPermissions();
        setPermissions(res);
      } else if (activeTab === 'audit') {
        const res = await teamRepo.getAuditLogs();
        setAuditLogs(res);
      }
    } catch (e) {
      console.warn("Falha ao buscar equipe: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (member: TeamMember) => {
    try {
      if (member.status === 'active') {
        if (!confirm('Deseja realmente suspender este usuário?')) return;
        await teamRepo.suspendMember(member.id);
      } else {
        await teamRepo.reactivateMember(member.id);
      }
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro ao alterar status');
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'members', label: 'Membros', icon: Users },
    { id: 'invitations', label: 'Convites', icon: Mail },
    { id: 'roles', label: 'Papéis (Roles)', icon: Shield },
    { id: 'permissions', label: 'Permissões', icon: Lock },
    { id: 'audit', label: 'Auditoria', icon: Fingerprint },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (status === 'suspended') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (status === 'invited') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const renderMembers = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <h3 className="font-heading font-semibold text-zinc-50 flex items-center gap-2">
          <Users size={18} className="text-amber-500" /> Equipe Ativa
        </h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-amber-950 font-medium text-sm rounded-lg transition-colors">
          <UserPlus size={16} /> Novo Membro
        </button>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
           <Loader2 className="animate-spin" size={24} />
           <p>Carregando equipe...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider bg-zinc-900/50">
                <th className="p-4 font-medium">Usuário</th>
                <th className="p-4 font-medium">Contato</th>
                <th className="p-4 font-medium">Papel</th>
                <th className="p-4 font-medium">Status / Último Acesso</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12">
                     <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4">
                          <Users className="text-zinc-500" size={20} />
                        </div>
                        <p className="text-sm font-medium text-zinc-300">Nenhum membro encontrado</p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm">A sua equipe adicionada aparecerá aqui.</p>
                     </div>
                  </td>
                </tr>
              )}
              {members.map(m => (
                <tr key={m.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold uppercase shrink-0">
                        {m.name.slice(0,2)}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-100">{m.name}</div>
                        <div className="text-xs text-zinc-500">Cadastrado em {new Date(m.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-zinc-300">{m.email}</div>
                    {m.phone && <div className="text-xs text-zinc-500">{m.phone}</div>}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-zinc-300 bg-zinc-800 px-2 py-1 rounded inline-block border border-zinc-700/50">
                       {m.roleName || 'Sem Papel'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5 items-start">
                       <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(m.status)}`}>
                         {m.status}
                       </span>
                       <span className="text-[11px] text-zinc-500">
                         {m.lastLoginAt ? `Acesso: ${new Date(m.lastLoginAt).toLocaleString()}` : 'Nunca logou'}
                       </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors" title="Editar Permissões">
                        <Shield size={16} />
                      </button>
                      <button className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors" title="Editar Usuário">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleStatusChange(m)} className={`p-1.5 rounded transition-colors ${m.status === 'active' ? 'text-zinc-400 hover:text-red-500 hover:bg-red-500/10' : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10'}`} title={m.status === 'active' ? 'Suspender' : 'Reativar'}>
                        {m.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderRoles = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1 border-r border-zinc-800 pr-6">
        <h3 className="font-heading font-semibold text-lg text-zinc-50 mb-4 flex items-center justify-between">
          Papéis (Roles)
          <button className="text-amber-500 hover:text-amber-400 p-1 bg-amber-500/10 rounded"><UserPlus size={16}/></button>
        </h3>
        <div className="space-y-2">
           {roles.map(r => (
             <button key={r.id} className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex items-center justify-between group">
               <div>
                 <div className="text-sm font-medium text-zinc-50 flex items-center gap-2">
                   {r.isSystem && <Shield size={12} className="text-amber-500" />} {r.name}
                 </div>
                 <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{r.description || 'Sem descrição'}</div>
               </div>
             </button>
           ))}
        </div>
      </div>
      <div className="col-span-1 md:col-span-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex items-center justify-center text-zinc-500 flex-col gap-4">
           <Shield size={32} className="opacity-20" />
           <p className="text-sm">Selecione um papel para visualizar as permissões detalhadas da matriz.</p>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase bg-zinc-900/50">
            <th className="p-4">Data/Hora</th>
            <th className="p-4">Usuário</th>
            <th className="p-4">Ação</th>
            <th className="p-4">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {auditLogs.length === 0 && (
             <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Nenhum log de auditoria encontrado.</td></tr>
          )}
          {auditLogs.map(l => (
            <tr key={l.id} className="hover:bg-zinc-800/10">
              <td className="p-4 text-zinc-400 font-mono text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="p-4 text-zinc-300">{l.user?.name || 'Sistema'}</td>
              <td className="p-4">
                 <span className="font-mono text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-300">{l.action}</span>
              </td>
              <td className="p-4 text-zinc-500 font-mono text-xs">{l.ipAddress || '---'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return renderMembers();
      case 'roles': return renderRoles();
      case 'audit': return renderAudit();
      default: return (
        <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mb-4">
               <Activity size={24} />
            </div>
            <h3 className="text-zinc-300 font-medium mb-2">Em Construção</h3>
            <p className="text-sm text-zinc-500 max-w-sm">Esta visualização está sendo preparada para a próxima etapa do roadmap.</p>
        </div>
      );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Gestão de Equipe e Acessos" 
        description="Controle de usuários, permissões granulares e auditoria do tenant." 
      />

      <div className="flex overflow-x-auto pb-2 border-b border-zinc-800 mb-6 gap-6 no-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
                isActive ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon size={16} />
              {t.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {renderContent()}
      </div>

    </div>
  );
}
