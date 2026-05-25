import React from 'react';
import { Activity, Clock, QrCode } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../../utils/format';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  icon: React.ComponentType<any>;
  type: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  recentExports: Array<{ id: string; code: string; updatedAt: string }>;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, recentExports }) => {
  const { t } = useTranslation();
  return (
    <div className="lg:col-span-4 h-full min-h-0">
      <Card className="p-4 h-full flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-blue-500" />
            {t('dashboard.recent_activities')}
          </h3>
          <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">{t('common.all')}</button>
        </div>
        
        <div className="flex-1 space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 overflow-y-auto custom-scrollbar pr-2 min-h-0">
          {activities.map((act) => (
            <div key={act.id} className="relative pl-8">
              <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm z-10">
                <act.icon className={`w-3 h-3 ${act.type === 'success' ? 'text-green-500' : act.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <p className="text-xs">
                  <span className="font-bold text-slate-900">{act.user}</span>
                  <span className="text-slate-500 mx-1">{act.action}</span>
                  <span className="font-mono text-blue-600 font-bold">{act.target}</span>
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <span className="text-[9px] text-slate-400">{formatDateTime(act.time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-50 shrink-0">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-tighter">{t('dashboard.recent_exports')}</h4>
          <div className="space-y-2">
            {recentExports.map(r => (
              <div key={r.id} className="flex justify-between items-center p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <QrCode className="w-3 h-3 text-slate-400" />
                  <span className="text-[11px] font-mono font-bold text-slate-700">{r.code}</span>
                </div>
                <Badge variant="gray" className="text-[8px] px-1.5 py-0">{formatDate(r.updatedAt)}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivityFeed;
