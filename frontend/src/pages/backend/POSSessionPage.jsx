import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { formatDateTime, formatDuration, formatCurrency } from '../../utils/formatters';
export default function POSSessionPage() {
    const { session, loading, fetchSession, openSession, closeSession } = useSession();
    const { success, error: showError } = useToast();
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    useEffect(() => { fetchSession(); }, [fetchSession]);
    const handleOpen = async () => {
        setActionLoading(true);
        try {
            await openSession();
            success('Session opened');
            navigate('/pos');
        } catch { showError('Failed to open session'); }
        setActionLoading(false);
    };
    const handleClose = async () => {
        setActionLoading(true);
        try {
            await closeSession();
            success('Session closed');
        } catch { showError('Failed to close session'); }
        setActionLoading(false);
    };
    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <h1 className="font-display text-2xl font-semibold text-cafe-espresso">POS Session</h1>
                <Skeleton variant="rect" height={200} />
            </div>
        );
    }
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display text-2xl font-semibold text-cafe-espresso">POS Session</h1>
                <p className="text-sm text-surface-500 mt-1">Manage your point-of-sale session</p>
            </div>
            <div className="bg-white rounded-2xl border border-surface-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-3 h-3 rounded-full ${session?.isOpen ? 'bg-success-500 animate-pulse' : 'bg-surface-400'}`} />
                    <span className={`text-lg font-bold ${session?.isOpen ? 'text-success-600' : 'text-surface-500'}`}>
                        {session?.isOpen ? 'Session Active' : 'Session Closed'}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-surface-50 rounded-xl">
                        <p className="text-xs text-surface-500 font-medium mb-1">Last Opened</p>
                        <p className="text-sm font-semibold text-surface-800">{formatDateTime(session?.openedAt)}</p>
                    </div>
                    <div className="p-4 bg-surface-50 rounded-xl">
                        <p className="text-xs text-surface-500 font-medium mb-1">Duration</p>
                        <p className="text-sm font-semibold text-surface-800">{formatDuration(session?.openedAt, session?.closedAt)}</p>
                    </div>
                    <div className="p-4 bg-surface-50 rounded-xl">
                        <p className="text-xs text-surface-500 font-medium mb-1">Total Revenue</p>
                        <p className="text-sm font-semibold text-surface-800">{formatCurrency(session?.totalRevenue)}</p>
                    </div>
                </div>
                {!session?.isOpen && session?.closedAt && (
                    <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                        <h3 className="text-sm font-bold text-primary-800 mb-3">Closing Summary</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-primary-600">Total Orders</p>
                                <p className="text-lg font-bold text-primary-900">{session?.totalOrders || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-primary-600">Total Revenue</p>
                                <p className="text-lg font-bold text-primary-900">{formatCurrency(session?.totalRevenue)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-primary-600">Session Duration</p>
                                <p className="text-lg font-bold text-primary-900">{formatDuration(session?.openedAt, session?.closedAt)}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex gap-3">
                    {session?.isOpen ? (
                        <>
                            <Button variant="danger" onClick={handleClose} loading={actionLoading}>Close Session</Button>
                            <Button onClick={() => navigate('/pos')}>Go to POS</Button>
                        </>
                    ) : (
                        <Button onClick={handleOpen} loading={actionLoading} size="lg">Open Session</Button>
                    )}
                </div>
            </div>
        </div>
    );
}