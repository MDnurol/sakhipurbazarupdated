import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Order } from '@/types';
import { getPagePath } from '@/src/utils/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { ShoppingBagIcon, SearchIcon, FilterIcon, ClockIcon, CheckCircleIcon, XIcon, TruckIcon, ArrowPathIcon, ChatBubbleLeftRightIcon, PhotoIcon, ArchiveBoxIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import OrderDetailsModal from './OrderDetailsModal';
import DeliveryRequestModal from './DeliveryRequestModal';

interface VendorOrdersTabProps {
    vendorId: string;
}

const VendorOrdersTab: React.FC<VendorOrdersTabProps> = ({ vendorId }) => {
    const { language, orders, users, updateOrderStatus, vendors, startChat, products } = useApp();
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [requestModalOrder, setRequestModalOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [orderFilter, setOrderFilter] = useState<'all' | 'retail' | 'wholesale' | 'history'>('all');
    const ORDERS_PER_PAGE = 10;

    const [realtimeOrders, setRealtimeOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Real-time subscription
    useEffect(() => {
        const q = query(
            collection(db, 'orders'),
            where('vendorId', '==', vendorId),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setRealtimeOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching realtime orders:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [vendorId]);

    // Filter Logic
    const allOrders = realtimeOrders.length > 0 ? realtimeOrders : (isLoading ? [] : orders.filter(o => o.vendorId === vendorId));

    const filteredOrders = useMemo(() => {
        if (orderFilter === 'all') return allOrders;
        if (orderFilter === 'history') return allOrders.filter(o => o.status === 'Delivered');

        return allOrders.filter(order => {
            const isWholesale = order.items.some(item => {
                const product = products.find(p => p.id === item.productId);
                return product?.productType === 'wholesale' || product?.wholesaleEnabled;
            });

            return orderFilter === 'wholesale' ? isWholesale : !isWholesale;
        });
    }, [allOrders, orderFilter, products]);

    const displayOrders = filteredOrders;
    const totalPages = Math.ceil(displayOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = displayOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'Manage Orders' : 'অর্ডার পরিচালনা করুন'}</h2>

                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                    {['all', 'retail', 'wholesale', 'history'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => { setOrderFilter(filter as any); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orderFilter === filter ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            {language === 'en' ? filter.charAt(0).toUpperCase() + filter.slice(1) : (filter === 'all' ? 'সব' : filter === 'retail' ? 'খুচরা' : filter === 'wholesale' ? 'পাইকারি' : 'ইতিহাস')}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">{language === 'en' ? 'Order ID' : 'অর্ডার আইডি'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Customer' : 'গ্রাহক'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Date' : 'তারিখ'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Total' : 'মোট'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Delivery' : 'ডেলিভারি'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Status' : 'স্ট্যাটাস'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Actions' : 'কর্ম'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(order => (
                            <tr key={order.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.id.split('-')[1]}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {users.find(u => u.id === order.customerId)?.name}
                                        <button onClick={async () => {
                                            const threadId = await startChat(order.customerId, { type: 'order', id: order.id, orderId: order.id, vendorId: order.vendorId });
                                            if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                        }} className="text-blue-500 hover:text-blue-700" title="Chat with Customer">
                                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">৳{order.total}</td>
                                <td className="px-6 py-4">
                                    {order.assignedDeliveryManId ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-[#2c3e50] dark:text-gray-300">
                                                {vendors.find(v => v.id === order.assignedDeliveryManId)?.name.en || 'Unknown Rider'}
                                            </span>
                                            {(order.status === 'Confirmed' || order.status === 'Preparing') && order.pickupCode && (
                                                <div className="mt-1 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-center">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Pickup Code</p>
                                                    <p className="text-base font-mono font-bold text-blue-600 tracking-widest">{order.pickupCode}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {(order.status === 'Confirmed' || order.status === 'Preparing') && !order.deliveryRequest ? (
                                                <button
                                                    onClick={() => setRequestModalOrder(order)}
                                                    className="bg-green-500 text-white hover:bg-green-600 px-3 py-1 rounded text-xs font-bold transition-colors"
                                                >
                                                    Request Delivery
                                                </button>
                                            ) : order.deliveryRequest?.status === 'pending' ? (
                                                <span className="text-xs text-yellow-600 font-bold">Waiting Response...</span>
                                            ) : order.deliveryRequest?.status === 'rejected' ? (
                                                <button
                                                    onClick={() => setRequestModalOrder(order)}
                                                    className="bg-orange-500 text-white hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold transition-colors"
                                                >
                                                    Request Again
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Pending Assignment</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {order.status}
                                        {order.podUrl && (
                                            <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1" title="Proof of Delivery Available">
                                                <PhotoIcon className="w-3 h-3" /> PoD
                                            </span>
                                        )}
                                        {order.refundInfo?.status === 'Requested' && <span className="text-xs font-bold text-orange-500">(Refund)</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedOrder(order)} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-lg text-xs hover:bg-blue-600">{language === 'en' ? 'Manage' : 'পরিচালনা'}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {displayOrders.some(o => o.refundInfo?.status === 'Requested') && (
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                        <ArchiveBoxIcon className="w-5 h-5" />
                        {language === 'en' ? 'Action Required: Refund Requests' : 'কর্ম প্রয়োজন: রিফান্ড অনুরোধ'}
                    </h3>
                    <div className="grid gap-4">
                        {displayOrders.filter(o => o.refundInfo?.status === 'Requested').map(order => (
                            <div key={`refund-${order.id}`} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">Order #{order.id.slice(-6)} - ৳{order.total}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">Reason: "{order.refundInfo?.reason}"</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'Refund Approved')}
                                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'Refund Rejected')}
                                        className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pt-8">
                <span className="text-sm text-gray-700 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={updateOrderStatus} />}
            {requestModalOrder && <DeliveryRequestModal order={requestModalOrder} vendorId={vendorId} onClose={() => setRequestModalOrder(null)} />}
        </div>
    );
};

export default VendorOrdersTab;
