import React from 'react';
import { History, Activity, TrendingUp, Lock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../utils/format';

interface LoginLog {
  id: string;
  email: string;
  loginAt: string;
  status: string;
  userAgent: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  module: string;
  email: string;
  createdAt: string;
}

interface AdminLogsTabProps {
  loginLogs: LoginLog[];
  activityLogs: ActivityLog[];
}

const AdminLogsTab: React.FC<AdminLogsTabProps> = ({ loginLogs, activityLogs }) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            {t('admin.login_logs')}
          </h3>
        </div>
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {loginLogs.map(log => (
            <div key={log.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-slate-900">{log.email}</p>
                  <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{formatDateTime(log.loginAt)}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate max-w-[200px]">Agent: {log.userAgent}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            {t('admin.activity_logs')}
          </h3>
        </div>
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {activityLogs.map(log => (
            <div key={log.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center z-10">
                <TrendingUp className="w-3 h-3 text-indigo-400" />
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                  <span className="text-[10px] text-slate-400 italic">{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{log.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{log.module}</span>
                  <span className="text-[10px] text-slate-400">By: {log.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminLogsTab;
