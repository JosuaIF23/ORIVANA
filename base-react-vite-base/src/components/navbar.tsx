import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Menu, Search } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { fetchMyClients } from '@/api/auth';
import novarisLogo from '@/assets/novaris_logo.png';


interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {

  const queryClient = useQueryClient();
  const {
    user,
    token,
    clients,
    activeClientId,
    setUser,
    setClients,
    setActiveClientId,
  } = useUserStore();
  const { data: accessibleClients = [] } = useQuery({
    queryKey: ['my-clients'],
    queryFn: fetchMyClients,
    enabled: !!token && !!user,
  });

  useEffect(() => {
    if (!accessibleClients.length) return;

    setClients(accessibleClients);
    if (user && JSON.stringify(user.clients || []) !== JSON.stringify(accessibleClients)) {
      setUser({ ...user, clients: accessibleClients });
    }
    const selectedStillAvailable = activeClientId
      ? accessibleClients.some((client) => client.id === activeClientId)
      : false;

    if (!selectedStillAvailable) {
      const defaultClient = accessibleClients.find((client) => client.is_default) ?? accessibleClients[0];
      setActiveClientId(defaultClient.id);
    }
  }, [accessibleClients, activeClientId, setActiveClientId, setClients, setUser, user]);


  const handleClientChange = (clientId: number | null) => {
    setActiveClientId(clientId);
    queryClient.invalidateQueries();
  };

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200/70 bg-slate-50 px-4 font-display tracking-tight shadow-sm sm:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200/70 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-32 items-center justify-center">
            <img src={novarisLogo} alt="Novaris" className="h-6 w-auto" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-5">
        <div className="relative hidden w-full max-w-md md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-0 bg-[#d9e4ea] py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-500 transition-colors focus:bg-[#d8e3fb] focus:outline-none focus:ring-1 focus:ring-[#545f73]/40"
            placeholder="Search Novaris..."
            type="text"
          />
        </div>

        {clients.length > 0 && (
          <select
            value={activeClientId ?? ''}
            onChange={(event) => handleClientChange(event.target.value ? parseInt(event.target.value, 10) : null)}
            className="max-w-[11rem] rounded-lg border-0 bg-[#e8eff3] px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#545f73]/40"
            aria-label="Active client"
          >
            <option value="" disabled>
              Select client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}

        <button className="hidden rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200/70 sm:block" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Account actions live in the sidebar profile control. */}
        {/*
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#545f73]/30 sm:gap-3"
              aria-label="Open user menu"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-[#d8e3fb] text-sm font-bold text-[#475266]">
                {user?.name?.slice(0, 1).toUpperCase() || 'U'}
              </div>
              <div className="hidden max-w-[12rem] leading-tight sm:block">
                <p className="truncate text-sm font-bold text-slate-800">{user?.name}</p>
                {activeRoleLabel && <p className="truncate text-xs font-medium text-slate-500">{activeRoleLabel}</p>}
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-[60] min-w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
            >
              <div className="px-3 py-2 sm:hidden">
                <p className="truncate text-sm font-bold text-slate-800">{user?.name}</p>
                {activeRoleLabel && <p className="truncate text-xs font-medium text-slate-500">{activeRoleLabel}</p>}
              </div>
              <DropdownMenu.Item
                onSelect={() => navigate({ to: '/settings' })}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 outline-none',
                  'transition-colors hover:bg-[#e8eff3] focus:bg-[#e8eff3]'
                )}
              >
                <Settings className="h-4 w-4 text-slate-500" />
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={handleLogout}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 outline-none',
                  'transition-colors hover:bg-[#e8eff3] focus:bg-[#e8eff3]'
                )}
              >
                <LogOut className="h-4 w-4 text-slate-500" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>*/}
      </div>
    </header>
  );
}
