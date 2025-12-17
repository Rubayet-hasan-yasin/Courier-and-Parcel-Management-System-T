import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useAgentDailySummary() {
    return useQuery({
        queryKey: ['agent-daily-summary'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const parcels = await api.get<any[]>('/parcels/assigned');

            const todaysParcels = parcels.filter((p: any) => {
                const createdDate = new Date(p.createdAt);
                return createdDate >= today;
            });

            const delivered = todaysParcels.filter((p: any) => p.status === 'delivered').length;
            const inProgress = todaysParcels.filter((p: any) =>
                p.status === 'picked_up' || p.status === 'in_transit'
            ).length;
            const pending = todaysParcels.filter((p: any) => p.status === 'pending').length;
            const failed = todaysParcels.filter((p: any) => p.status === 'failed').length;

            return {
                total: todaysParcels.length,
                delivered,
                inProgress,
                pending,
                failed,
                completionRate: todaysParcels.length > 0
                    ? ((delivered / todaysParcels.length) * 100).toFixed(1)
                    : '0',
            };
        },
        refetchInterval: 30000,
    });
}
