import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import {
    HomeIcon,
    ArchiveBoxIcon,
    ShoppingBagIcon,
    CurrencyDollarIcon,
    TruckIcon,
    StarIcon,
    PencilIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    MegaphoneIcon
} from '@/components/icons';

// Lazy load modular tab components
const VendorOverviewTab = lazy(() => import('@/src/components/dashboard/vendor/VendorOverviewTab'));
const VendorProductsTab = lazy(() => import('@/src/components/dashboard/vendor/VendorProductsTab'));
const VendorOrdersTab = lazy(() => import('@/src/components/dashboard/vendor/VendorOrdersTab'));
const VendorEarningsTab = lazy(() => import('@/src/components/dashboard/vendor/VendorEarningsTab'));
const VendorLogisticsTab = lazy(() => import('@/src/components/dashboard/vendor/VendorLogisticsTab'));
const VendorReviewsTab = lazy(() => import('@/src/components/dashboard/vendor/VendorReviewsTab'));
const VendorDraftsTab = lazy(() => import('@/src/components/dashboard/vendor/VendorDraftsTab'));

// Existing external tabs
import PromotionsTab from './PromotionsTab';
import VendorTeamManagement from './VendorTeamManagement';

type VendorTab = 'overview' | 'products' | 'drafts' | 'orders' | 'earnings' | 'promotions' | 'team' | 'logistics' | 'reviews';

const VendorDashboardPage: React.FC = () => {
    const { language, currentUser, vendors } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<VendorTab>('overview');

    const vendor = vendors.find(v => v.id === currentUser?.shopId);

    useEffect(() => {
        if (!currentUser || (currentUser.role !== 'vendor' && currentUser.role !== 'admin')) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    if (!vendor) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-100 dark:border-slate-700">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ArchiveBoxIcon className="w-10 h-10 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Shop Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">We couldn't find a vendor profile associated with your account.</p>
                    <button 
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    const tabs: { id: VendorTab; label: { en: string; bn: string }; icon: any }[] = [
        { id: 'overview', label: { en: 'Overview', bn: 'ওভারভিউ' }, icon: HomeIcon },
        { id: 'products', label: { en: 'Products', bn: 'পণ্য' }, icon: ArchiveBoxIcon },
        { id: 'drafts', label: { en: 'Drafts', bn: 'ড্রাফট' }, icon: PencilIcon },
        { id: 'orders', label: { en: 'Orders', bn: 'অর্ডারস' }, icon: ShoppingBagIcon },
        { id: 'earnings', label: { en: 'Earnings', bn: 'উপার্জন' }, icon: CurrencyDollarIcon },
        { id: 'promotions', label: { en: 'Promotions', bn: 'প্রোমোশন' }, icon: MegaphoneIcon },
        { id: 'team', label: { en: 'Team', bn: 'টিম' }, icon: UserGroupIcon },
        { id: 'logistics', label: { en: 'Logistics', bn: 'লজিস্টিক' }, icon: TruckIcon },
        { id: 'reviews', label: { en: 'Reviews', bn: 'রিভিউ' }, icon: StarIcon },
    ];

    const renderTabContent = () => {
        return (
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Loading {activeTab}...</p>
                </div>
            }>
                {activeTab === 'overview' && <VendorOverviewTab vendorId={vendor.id} />}
                {activeTab === 'products' && <VendorProductsTab vendorId={vendor.id} />}
                {activeTab === 'drafts' && <VendorDraftsTab vendorId={vendor.id} />}
                {activeTab === 'orders' && <VendorOrdersTab vendorId={vendor.id} />}
                {activeTab === 'earnings' && <VendorEarningsTab vendorId={vendor.id} />}
                {activeTab === 'promotions' && <PromotionsTab vendorId={vendor.id} />}
                {activeTab === 'team' && <VendorTeamManagement vendorId={vendor.id} />}
                {activeTab === 'logistics' && <VendorLogisticsTab vendorId={vendor.id} />}
                {activeTab === 'reviews' && <VendorReviewsTab vendorId={vendor.id} />}
            </Suspense>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-24 lg:pb-0">
            <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-screen">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex flex-col w-80 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 sticky top-0 h-screen overflow-y-auto">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <span className="text-white font-black text-xl">S</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vendor Panel</p>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sakhipur Bazar</h2>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-[0.98]'
                                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                                    {tab.label[language]}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-8 border-t dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={vendor.logo} className="w-12 h-12 rounded-xl object-cover" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{vendor.name[language]}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-800 transition-all"
                        >
                            Visit Store
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 lg:hidden">
                        <div className="flex overflow-x-auto no-scrollbar py-4 px-4 gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                                    }`}
                                >
                                    {tab.label[language]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 lg:p-12">
                        {renderTabContent()}
                    </div>
                </main>
            </div>

            {/* Floating Action Button */}
            <button 
                onClick={() => setActiveTab('reviews')}
                className="fixed bottom-28 right-6 lg:bottom-10 lg:right-10 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group shadow-blue-500/40"
            >
                <ChatBubbleLeftRightIcon className="w-8 h-8" />
            </button>
        </div>
    );
};

export default VendorDashboardPage;
