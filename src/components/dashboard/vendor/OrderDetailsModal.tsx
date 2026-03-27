import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Order, OrderStatus } from '@/types';
import { getPagePath } from '@/src/utils/navigation';
import { XIcon, ShoppingBagIcon, MapPinIcon, PhoneIcon, ChatBubbleLeftRightIcon, TruckIcon, ClockIcon, CheckCircleIcon, CreditCardIcon, UserIcon, PrinterIcon, PhotoIcon, ExclamationTriangleIcon } from '@/components/icons';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onStatusChange: (orderId: string, status: OrderStatus) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, onStatusChange }) => {
    const { language, users, startChat } = useApp();
    const navigate = useNavigate();
    const [isPodExpanded, setIsPodExpanded] = useState(false);
    const customer = users.find(u => u.id === order.customerId);
    const availableStatuses: OrderStatus[] = ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-700 pb-4 mb-4">
                        <h2 className="text-xl font-bold">Order Details #{order.id.split('-')[1]}</h2>
                        <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">Customer Info</h3>
                                <button onClick={async () => {
                                    const threadId = await startChat(order.customerId, { type: 'order', id: order.id, orderId: order.id, vendorId: order.vendorId });
                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                }} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                    <ChatBubbleLeftRightIcon className="w-3 h-3" /> Chat
                                </button>
                            </div>
                            <p><strong>Name:</strong> {customer?.name}</p>
                            <p><strong>Address:</strong> {
                                typeof order.deliveryAddress === 'object'
                                    ? `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.area}`
                                    : (order.deliveryAddress || customer?.address || 'N/A')
                            }</p>
                            <p><strong>Phone:</strong> {order.deliveryPhone || customer?.phone}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Order Items</h3>
                            {order.items.map(item => (
                                <div key={item.productId} className="flex gap-4 py-2 border-b dark:border-slate-700 last:border-b-0">
                                    <img src={item.productImage} alt={item.productName[language]} className="w-16 h-16 rounded-md" />
                                    <div>
                                        <p className="font-semibold">{item.productName[language]}</p>
                                        <p className="text-sm">Qty: {item.quantity} x ৳{item.priceAtPurchase}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                            <div className="text-right font-bold text-lg">
                                Total: ৳{order.total}
                            </div>
                            <div className="flex gap-4">
                                {order.pickupCode && (order.status === 'Confirmed' || order.status === 'Preparing') && (
                                    <div className="text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Pickup Code</p>
                                        <p className="text-xl font-mono font-bold text-blue-600 tracking-widest">{order.pickupCode}</p>
                                    </div>
                                )}
                                {order.deliveryCode && order.assignedDeliveryManId === order.vendorId && (order.status === 'Out for Delivery') && (
                                    <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-2 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Delivery Code</p>
                                        <p className="text-xl font-mono font-bold text-green-600 tracking-widest">{order.deliveryCode}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {order.podUrl && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl relative overflow-hidden group">
                                <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    {language === 'en' ? 'Proof of Delivery (Verified)' : 'ডেলিভারি প্রমাণ (যাচাইকৃত)'}
                                </h3>

                                <div
                                    className="relative cursor-pointer group/pod"
                                    onClick={() => setIsPodExpanded(!isPodExpanded)}
                                >
                                    <img
                                        src={order.podUrl}
                                        alt="Proof of Delivery"
                                        className={`w-full rounded-lg border dark:border-slate-700 transition-all duration-300 ${isPodExpanded ? 'max-h-[80vh] object-contain shadow-2xl' : 'max-h-48 object-cover shadow-sm hover:shadow-md'}`}
                                    />
                                    {!isPodExpanded && (
                                        <div className="absolute inset-0 bg-black/0 group-hover/pod:bg-black/10 flex items-center justify-center transition-all rounded-lg">
                                            <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full opacity-0 group-hover/pod:opacity-100 transition-opacity shadow-lg">
                                                <PhotoIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity ${isPodExpanded ? 'opacity-100' : 'opacity-0'}`}
                                        onClick={(e) => { e.stopPropagation(); setIsPodExpanded(false); }}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 italic mt-2 text-right">
                                    {language === 'en' ? 'Click to expand image' : 'ছবি বড় করতে ক্লিক করুন'}
                                </p>
                            </div>
                        )}
                        {order.status === 'Cancelled' && (order.cancellationReason || order.cancelledBy) && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-lg">
                                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    Cancellation Info
                                </h3>
                                {order.cancelledBy && <p className="text-sm dark:text-gray-300"><strong>Cancelled By:</strong> {order.cancelledBy.charAt(0).toUpperCase() + order.cancelledBy.slice(1)}</p>}
                                {order.cancellationReason && <p className="text-sm dark:text-gray-300"><strong>Reason:</strong> {order.cancellationReason}</p>}
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold mb-2">Update Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {availableStatuses.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => onStatusChange(order.id, status)}
                                        disabled={order.status === status}
                                        className={`px-3 py-1 text-sm rounded-full ${order.status === status ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
