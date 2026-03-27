import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/src/context/AppContext';
import { Order } from '@/types';
import { DeliveryService } from '@/src/services/deliveryService';
import { TruckIcon, MapPinIcon, ShoppingBagIcon, InformationCircleIcon, CheckCircleIcon, XIcon, StarIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface DeliveryRequestModalProps {
    order: Order;
    vendorId: string;
    onClose: () => void;
}

const DeliveryRequestModal: React.FC<DeliveryRequestModalProps> = ({ order, vendorId, onClose }) => {
    const { language, vendors, platformSettings } = useApp();
    const [selectedTab, setSelectedTab] = useState<'team' | 'marketplace'>('marketplace');
    const [myTeam, setMyTeam] = useState<any[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [requesting, setRequesting] = useState(false);

    // Filter available delivery men (Marketplace)
    const marketplaceDrivers = useMemo(() => vendors.filter(v =>
        v.type === 'deliveryMan' &&
        v.deliveryManProfile?.isAvailable &&
        v.onlineStatus === 'Online' &&
        !v.vendorId // Independent drivers only
    ), [vendors]);

    // Fetch My Team
    useEffect(() => {
        const team = vendors.filter(v => v.type === 'deliveryMan' && v.vendorId === vendorId);
        setMyTeam(team);
    }, [vendors, vendorId]);

    const activeList = selectedTab === 'team' ? myTeam : marketplaceDrivers;

    const toggleDriver = (id: string) => {
        setSelectedDrivers(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };

    const handleSendRequests = async () => {
        if (selectedDrivers.length === 0) {
            toast.error("Please select at least one driver.");
            return;
        }
        setRequesting(true);
        try {
            // Create a map of IDs to Names for the service
            const namesMap: Record<string, string> = {};
            selectedDrivers.forEach(id => {
                const driver = vendors.find(v => v.id === id);
                if (driver) namesMap[id] = driver.name[language] || driver.name['en'];
            });

            await DeliveryService.requestDeliveryBroadcast(order.id, selectedDrivers, namesMap);
            toast.success(`Sent requests to ${selectedDrivers.length} drivers!`);
            onClose();
        } catch (error) {
            console.error("Error requesting delivery", error);
            toast.error("Failed to send requests.");
        } finally {
            setRequesting(false);
        }
    };

    const handleSelfDelivery = async () => {
        try {
            await DeliveryService.assignSelfDelivery(order.id, vendorId);
            toast.success("Assigned to yourself!");
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Failed to assign self.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {language === 'en' ? 'Request Delivery' : 'ডেলিভারি অনুরোধ'}
                        </h2>
                        <p className="text-sm text-gray-500">Order #{order.id.slice(-6)} • ৳{order.total}</p>
                    </div>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-500 hover:text-red-500 transition-colors" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setSelectedTab('marketplace')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${selectedTab === 'marketplace' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                        Marketplace ({marketplaceDrivers.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('team')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${selectedTab === 'team' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                        My Team ({myTeam.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-slate-900/20">
                    {/* Self Delivery Option */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                <TruckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-800 dark:text-blue-200">Deliver Myself</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-300 opacity-80">Skip the search and handle this delivery personally.</p>
                            </div>
                        </div>
                        <button onClick={handleSelfDelivery} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                            Assign to Me
                        </button>
                    </div>

                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 px-1 text-sm uppercase tracking-wide">
                        Select Drivers to Request ({selectedDrivers.length})
                    </h4>

                    {activeList.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                            <TruckIcon className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500">No {selectedTab === 'team' ? 'team members' : 'marketplace drivers'} available currently.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeList.map(driver => (
                                <div key={driver.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedDrivers.includes(driver.id) ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}`}
                                    onClick={() => toggleDriver(driver.id)}
                                >
                                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center mr-4 transition-colors ${selectedDrivers.includes(driver.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {selectedDrivers.includes(driver.id) && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                    </div>
                                    <img src={driver.logo || `https://ui-avatars.com/api/?name=${driver.name.en}`} className="w-12 h-12 rounded-full object-cover mr-4 border border-gray-100 dark:border-slate-600" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 dark:text-white text-base">{driver.name[language]}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-yellow-500" /> {driver.deliveryManProfile?.rating || 0}</span>
                                            <span>•</span>
                                            <span>{driver.deliveryManProfile?.totalDeliveries || 0} Deliveries</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
                    <div className="text-sm">
                        <span className="text-gray-500">Selected:</span>
                        <span className="font-bold text-gray-800 dark:text-white ml-1 text-lg">{selectedDrivers.length}</span>
                    </div>
                    <button
                        onClick={handleSendRequests}
                        disabled={requesting || selectedDrivers.length === 0}
                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30 transition-all transform active:scale-95"
                    >
                        {requesting ? 'Sending...' : 'Send Requests'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryRequestModal;
