import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { ImageService } from '@/src/services/imageService';
import { CurrencyDollarIcon, ArchiveBoxIcon, ShoppingBagIcon, TruckIcon, ExclamationTriangleIcon, TrendingUpIcon, CheckCircleIcon, ArrowUpOnSquareIcon, PencilIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface VendorOverviewTabProps {
    vendorId: string;
}

const VendorOverviewTab: React.FC<VendorOverviewTabProps> = ({ vendorId }) => {
    const { language, vendors, products, orders, updateVendorOnlineStatus, updateVendor } = useApp();
    const navigate = useNavigate();
    const vendor = vendors.find(v => v.id === vendorId);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Name Edit State
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [newNameEn, setNewNameEn] = useState(vendor?.name.en || '');
    const [newNameBn, setNewNameBn] = useState(vendor?.name.bn || '');

    const handleNameUpdate = async () => {
        if (!vendor || !newNameEn.trim()) return;
        try {
            await updateVendor(vendor.id, {
                name: {
                    en: newNameEn.trim(),
                    bn: newNameBn.trim() || newNameEn.trim()
                }
            });
            toast.success(language === 'en' ? 'Shop name updated!' : 'দোকানের নাম আপডেট করা হয়েছে!');
            setIsEditNameOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update name');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bannerImage') => {
        const file = e.target.files?.[0];
        if (!file || !vendor) return;

        const isLogo = type === 'logo';
        if (isLogo) setUploadingLogo(true);
        else setUploadingBanner(true);

        const toastId = toast.loading(`Uploading ${type}...`);

        try {
            const downloadUrl = await ImageService.uploadImage(
                file,
                `vendor_assets/${vendor.id}_${type}_${Date.now()}`
            );

            await updateVendor(vendor.id, { [type]: downloadUrl });
            toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} updated!`, { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error(`Failed to upload ${type}.`, { id: toastId });
        } finally {
            if (isLogo) setUploadingLogo(false);
            else setUploadingBanner(false);
        }
    };

    if (!vendor) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <p className="text-red-500 font-bold mb-2">Vendor Profile Not Found</p>
                <p className="text-gray-500 text-sm">Could not locate vendor data for ID: {vendorId}</p>
            </div>
        );
    }
    const vendorProducts = products.filter(p => p.vendorId === vendorId);
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);
    const totalRevenue = vendorOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrdersCount = vendorOrders.filter(o => o.status === 'Pending').length;
    const recentOrders = vendorOrders.slice(0, 5);
    const lowStockProducts = vendorProducts.filter(p => p.stock > 0 && p.stock < 5);

    const [deliveryMode, setDeliveryMode] = useState<'shop' | 'platform'>('shop');

    const stats = [
        { title: { en: 'Total Revenue', bn: 'মোট আয়' }, value: `৳${totalRevenue.toLocaleString()}`, icon: CurrencyDollarIcon },
        { title: { en: 'Total Products', bn: 'মোট পণ্য' }, value: vendorProducts.length, icon: ArchiveBoxIcon },
        { title: { en: 'Pending Orders', bn: 'বিচারাধীন অর্ডার' }, value: pendingOrdersCount, icon: ShoppingBagIcon },
    ];

    const handleStatusToggle = () => {
        const newStatus = vendor.onlineStatus === 'Online' ? 'Offline' : 'Online';
        updateVendorOnlineStatus(vendorId, newStatus);
    };

    return (
        <div className="space-y-8 p-6">
            {/* Banner Section */}
            <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-100 group">
                <img
                    src={vendor.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200'}
                    alt="Store Banner"
                    className="w-full h-full object-cover"
                />
                {uploadingBanner && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <label className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg cursor-pointer shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                    <ArrowUpOnSquareIcon className="w-5 h-5 text-rose-500" />
                    {language === 'en' ? 'Change Cover' : 'কভার পরিবর্তন করুন'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerImage')} disabled={uploadingBanner} />
                </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 -mt-16 sm:-mt-20 px-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                    <div className="relative">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-white">
                            <img src={vendor.logo} alt={vendor.name[language]} className="w-full h-full object-cover" />
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-rose-600 transition-transform hover:scale-110">
                            <ArrowUpOnSquareIcon className="w-5 h-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} disabled={uploadingLogo} />
                        </label>
                    </div>
                    <div className="pb-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">{vendor.name[language]}</h1>
                            <button
                                onClick={() => {
                                    setNewNameEn(vendor.name.en);
                                    setNewNameBn(vendor.name.bn);
                                    setIsEditNameOpen(true);
                                }}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                            <span className={`w-3 h-3 rounded-full ${vendor.onlineStatus === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></span>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {vendor.onlineStatus === 'Online' ? (language === 'en' ? 'Shop Online' : 'দোকান অনলাইন') : (language === 'en' ? 'Shop Offline' : 'দোকান অফলাইন')}
                            </span>
                        </div>
                    </div>
                </div>

                {isEditNameOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setIsEditNameOpen(false)}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-4 dark:text-white">{language === 'en' ? 'Edit Shop Name' : 'দোকানের নাম পরিবর্তন করুন'}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Shop Name (English)' : 'দোকানের নাম (ইংরেজি)'}</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={newNameEn}
                                        onChange={e => setNewNameEn(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Shop Name (Bengali)' : 'দোকানের নাম (বাংলা)'}</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={newNameBn}
                                        onChange={e => setNewNameBn(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsEditNameOpen(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-bold text-gray-700 dark:text-gray-200">
                                    {language === 'en' ? 'Cancel' : 'বাতিল'}
                                </button>
                                <button onClick={handleNameUpdate} className="flex-1 py-2 rounded-lg bg-rose-500 text-white font-bold">
                                    {language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col items-start sm:items-end gap-3">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'en' ? 'Accepting Orders' : 'অর্ডার গ্রহণ করছেন'}</span>
                        <button onClick={handleStatusToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${vendor.onlineStatus === 'Online' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${vendor.onlineStatus === 'Online' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                        <div className="bg-rose-100 dark:bg-rose-900/50 p-3 rounded-full">
                            <stat.icon className="h-7 w-7 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title[language]}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery Preferences */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-rose-500" />
                    {language === 'en' ? 'Delivery Preferences' : 'ডেলিভারি পছন্দ'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setDeliveryMode('shop')}
                        className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${deliveryMode === 'shop'
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-rose-300'
                            }`}
                    >
                        <span className="block font-bold text-gray-800 dark:text-gray-100 mb-1">{language === 'en' ? 'Shop Managed' : 'দোকান দ্বারা পরিচালিত'}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'You handle your own deliveries.' : 'আপনি আপনার নিজের ডেলিভারি পরিচালনা করেন।'}</span>
                    </button>
                    <button
                        onClick={() => setDeliveryMode('platform')}
                        className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${deliveryMode === 'platform'
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-rose-300'
                            }`}
                    >
                        <span className="block font-bold text-gray-800 dark:text-gray-100 mb-1">{language === 'en' ? 'Platform Managed' : 'প্ল্যাটফর্ম দ্বারা পরিচালিত'}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'We assign riders for you.' : 'আমরা আপনার জন্য রাইডার নিয়োগ করি।'}</span>
                    </button>
                </div>
            </div>

            {/* "Requires Action" Section */}
            {vendorProducts.some(p => p.status === 'ReviewRequested') && (
                <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-200 dark:border-rose-800/20 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-500 text-white rounded-lg">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-rose-800 dark:text-rose-200">
                            {language === 'en' ? 'Review Requested by Admin' : 'অ্যাডমিন দ্বারা রিভিউ অনুরোধ করা হয়েছে'}
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {vendorProducts.filter(p => p.status === 'ReviewRequested').map(product => (
                            <div key={product.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <img src={product.images[0]} alt={product.name[language]} className="w-12 h-12 rounded-lg object-cover" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{product.name[language]}</p>
                                        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium italic">
                                            Feedback: {product.reviewRequestReason || (language === 'en' ? 'Please check details' : 'বিস্তারিত চেক করুন')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/edit-product/${product.id}`)}
                                    className="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-lg hover:bg-rose-600 grow sm:grow-0"
                                >
                                    {language === 'en' ? 'View & Edit' : 'দেখুন এবং এডিট করুন'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">{language === 'en' ? 'Performance Feed' : 'পারফরম্যান্স ফিড'}</h3>
                        <TrendingUpIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {recentOrders.map(order => (
                            <div key={order.id} className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl flex items-center gap-4 group cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-blue-500">
                                    <ShoppingBagIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-gray-900 dark:text-white">Order #{order.id.slice(-6)}</p>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">৳{order.total} • {order.items.length} items</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>{order.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && (
                            <div className="py-10 text-center text-gray-400 italic text-sm">No recent orders yet.</div>
                        )}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">{language === 'en' ? 'Critical Alerts' : 'গুরুত্বপূর্ণ সতর্কতা'}</h3>
                        <ExclamationTriangleIcon className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="space-y-4">
                        {lowStockProducts.map(product => (
                            <div key={product.id} className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-rose-500">
                                    <ArchiveBoxIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 dark:text-white">{product.name[language]}</p>
                                    <p className="text-sm text-rose-600 font-medium">{product.stock} {language === 'en' ? 'units remaining' : 'ইউনিট বাকি'}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/edit-product/${product.id}`)}
                                    className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {lowStockProducts.length === 0 && (
                            <div className="py-14 text-center bg-gray-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center">
                                <CheckCircleIcon className="w-10 h-10 text-green-500/30 mb-2" />
                                <p className="text-sm text-gray-500">All products have healthy stock levels.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorOverviewTab;
