import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/src/context/AppContext';
import { Transaction, CategoryCommission } from '@/types';
import { EconomicsService } from '@/src/services/economics';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { WalletIcon, ArrowUpOnSquareIcon, CurrencyDollarIcon, CreditCardIcon, QuestionMarkCircleIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, AdjustmentsHorizontalIcon, XIcon } from '@/components/icons';
import FinancialSettingsForm from './FinancialSettingsForm';
import toast from 'react-hot-toast';

interface VendorEarningsTabProps {
    vendorId: string;
}

const VendorEarningsTab: React.FC<VendorEarningsTabProps> = ({ vendorId }) => {
    const { language, vendors, requestVendorPayout, orders } = useApp();
    const vendor = vendors.find(v => v.id === vendorId);

    if (!vendor) return <div className="p-8 text-center text-gray-500">Vendor data not found</div>;

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showPayoutSettings, setShowPayoutSettings] = useState(false);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    const vendorOrders = useMemo(() => orders.filter(o => o.vendorId === vendorId), [orders, vendorId]);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'transactions'),
                    where('vendorId', '==', vendorId),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                    setTransactions(txs);
                    setLoading(false);
                });
                return unsubscribe;
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [vendorId, refreshTrigger]);

    const handleWithdraw = async (amount: number) => {
        if (amount > (vendor.walletBalance || 0)) {
            toast.error(language === 'en' ? 'Insufficient balance' : 'অপর্যাপ্ত ব্যালেন্স');
            return;
        }
        if (amount < 500) {
            toast.error(language === 'en' ? 'Minimum withdrawal is ৳500' : 'সর্বনিম্ন উত্তোলন ৳৫০০');
            return;
        }

        try {
            await requestVendorPayout(vendorId, amount, vendor.payoutSettings);
            toast.success(language === 'en' ? 'Withdrawal request submitted!' : 'উত্তোলন অনুরোধ জমা দেওয়া হয়েছে!');
            setIsWithdrawalModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error('Withdrawal request failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
                    <WalletIcon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                    <p className="text-blue-100 text-sm font-medium mb-1">{language === 'en' ? 'Available Balance' : 'বর্তমান ব্যালেন্স'}</p>
                    <h3 className="text-4xl font-bold mb-4">৳{vendor.walletBalance?.toFixed(2) || '0.00'}</h3>
                    <button
                        onClick={() => setIsWithdrawalModalOpen(true)}
                        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/20"
                    >
                        <ArrowUpOnSquareIcon className="w-5 h-5" />
                        {language === 'en' ? 'Withdraw Funds' : 'টাকা উত্তোলন'}
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{language === 'en' ? 'Pending Clearance' : 'অপেক্ষমাণ ব্যালেন্স'}</p>
                            <ClockIcon className="w-5 h-5 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">৳{vendor.pendingBalance?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 flex items-center gap-1 italic">
                        <QuestionMarkCircleIcon className="w-3 h-3" />
                        {language === 'en' ? 'Cleared after order completion' : 'অর্ডার সম্পন্ন হলে যুক্ত হবে'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{language === 'en' ? 'Total Withdrawn' : 'মোট উত্তোলন'}</p>
                            <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">৳{(vendor.totalWithdrawn || 0).toFixed(2)}</h3>
                    </div>
                    <p className="text-xs text-green-500 mt-4 font-bold flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3" />
                        {language === 'en' ? 'All payouts successful' : 'সব পেমেন্ট সফল'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/20">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-500" />
                        {language === 'en' ? 'Payout Configuration' : 'পেমেন্ট কনফিগারেশন'}
                    </h3>
                    <button
                        onClick={() => setShowPayoutSettings(!showPayoutSettings)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {showPayoutSettings ? 'Hide Settings' : 'Manage Settings'}
                    </button>
                </div>
                {showPayoutSettings ? (
                    <div className="p-6">
                        <FinancialSettingsForm vendor={vendor} language={language} onUpdate={() => setShowPayoutSettings(false)} />
                    </div>
                ) : (
                    <div className="p-4 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                                <CreditCardIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Primary Payout Link</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                    {vendor.payoutSettings?.method || 'Not Set'} {vendor.payoutSettings?.accountNumber && `(${vendor.payoutSettings.accountNumber})`}
                                </p>
                            </div>
                        </div>
                        {vendor.payoutSettings?.lastUpdated && (
                            <p className="text-[10px] text-gray-400 italic">Last Updated: {new Date(vendor.payoutSettings.lastUpdated).toLocaleDateString()}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{language === 'en' ? 'Transaction History' : 'লেনদেনের ইতিহাস'}</h3>
                    <button onClick={() => setRefreshTrigger(t => t + 1)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                        <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Reference</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-20 text-gray-500">Loading your transaction history...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-20 text-gray-500">No transactions recorded yet.</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-mono text-[10px] text-gray-400">ID: {tx.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="font-medium text-gray-700 dark:text-gray-300">
                                            {tx.type === 'order_sale' ? `Order Sale #${tx.orderId?.slice(-6)}` :
                                             tx.type === 'payout' ? 'Payout Withdrawal' :
                                             tx.type === 'correction' ? 'Admin Correction' : tx.type}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 uppercase text-[10px] font-bold">
                                        <span className={tx.type === 'order_sale' ? 'text-green-600' : 'text-orange-600'}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                        {tx.type === 'order_sale' ? '+' : '-'} ৳{tx.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            tx.status === 'completed' || tx.status === 'success' ? 'bg-green-100 text-green-700' :
                                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isWithdrawalModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h3>
                                <button onClick={() => setIsWithdrawalModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><XIcon className="w-6 h-6" /></button>
                            </div>

                            {!vendor.payoutSettings?.accountNumber ? (
                                <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl text-center">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                    <p className="text-red-800 dark:text-red-300 font-medium mb-4">Please configure your payout settings first.</p>
                                    <button
                                        onClick={() => { setIsWithdrawalModalOpen(false); setShowPayoutSettings(true); }}
                                        className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-shadow shadow-md hover:shadow-red-500/30"
                                    >
                                        Go to Settings
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Withdraw to:</label>
                                        <div className="p-4 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{vendor.payoutSettings.method}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{vendor.payoutSettings.accountNumber}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Available: ৳{vendor.balance?.toFixed(2)}</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">৳</span>
                                            <input
                                                type="number"
                                                id="withdrawAmount"
                                                className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-slate-900/40 border-2 border-transparent focus:border-blue-500 rounded-2xl text-2xl font-bold outline-none transition-all"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 italic">* Minimum withdrawal ৳500. Standard processing time applies.</p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            const amount = parseFloat((document.getElementById('withdrawAmount') as HTMLInputElement).value);
                                            handleWithdraw(amount);
                                        }}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
                                    >
                                        Request Withdrawal
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorEarningsTab;
