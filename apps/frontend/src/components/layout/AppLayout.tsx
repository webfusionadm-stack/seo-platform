import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useRank } from '../../hooks/useRank';
import SakuraParticles from '../ui/SakuraParticles';

export function AppLayout() {
  const { data: rank } = useRank();
  const rankName = rank?.currentRank?.name || 'BRONZE';

  return (
    <div className="flex min-h-screen" data-rank={rankName}>
      <SakuraParticles />
      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
