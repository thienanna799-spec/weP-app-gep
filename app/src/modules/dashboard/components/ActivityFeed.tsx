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
    <div className="lg:col-span-4 space-y-6">
      <Card className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            {t('dashboard.recent_activities')}
          </h3>
          <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">{t('common.all')}</button>
        </div>
        
        <div className="flex-1 space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          {activities.map((act) => (
            <div key={act.id} className="relative pl-10">
              <div className="absolute left-0 top-0.5 w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm z-10">
                <act.icon className={`w-4 h-4 ${act.type === 'success' ? 'text-green-500' : act.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-bold text-slate-900">{act.user}</span>
                  <span className="text-slate-500 mx-1">{act.action}</span>
                  <span className="font-mono text-blue-600 font-bold">{act.target}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <span className="text-[10px] text-slate-400">{formatDateTime(act.time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-tighter">{t('dashboard.recent_exports')}</h4>
          <div className="space-y-3">
            {recentExports.map(r => (
              <div key={r.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-mono font-bold text-slate-700">{r.code}</span>
                </div>
                <Badge variant="gray" className="text-[9px] px-1.5 py-0">{formatDate(r.updatedAt)}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivityFeed;
