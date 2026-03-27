import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Invitation } from '@/types';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { TruckIcon, MapPinIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, UserIcon, PhoneIcon, ChatBubbleLeftRightIcon, QuestionMarkCircleIcon, PlusIcon, ArrowPathIcon, UserGroupIcon, XIcon, StarIcon } from '@/components/icons';
import { getPagePath } from '@/src/utils/navigation';
import toast from 'react-hot-toast';

interface VendorLogisticsTabProps {
    vendorId: string;
}

const VendorLogisticsTab: React.FC<VendorLogisticsTabProps> = ({ vendorId }) => {
    const { language, vendors, startChat } = useApp();
    const navigate = useNavigate();
    const currentVendor = vendors.find(v => v.id === vendorId);
    const [subTab, setSubTab] = useState<'team' | 'recruit'>('team');

    // State
    const [myTeam, setMyTeam] = useState<any[]>([]);
    const [availableRiders, setAvailableRiders] = useState<any[]>([]);
    const [sentInvites, setSentInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch My Team
    useEffect(() => {
        const q = query(
            collection(db, 'vendors'),
            where('type', '==', 'deliveryMan'),
            where('vendorId', '==', vendorId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((d: any) => d.status !== 'Suspended'));
        });
        return () => unsubscribe();
    }, [vendorId]);

    // Fetch Available Riders (Independent) & Sent Invites
    useEffect(() => {
        if (subTab === 'recruit') {
            setLoading(true);
            const qRiders = query(collection(db, 'vendors'), where('type', '==', 'deliveryMan'));
            const unsubRiders = onSnapshot(qRiders, (snapshot) => {
                const allRiders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                const independent = allRiders.filter(r => (!r.vendorId || r.vendorId === 'platform') && r.status !== 'Suspended');
                setAvailableRiders(independent);
                setLoading(false);
            });

            const qInvites = query(
                collection(db, 'invitations'),
                where('fromVendorId', '==', vendorId),
                where('status', '==', 'pending')
            );
            const unsubInvites = onSnapshot(qInvites, (snapshot) => {
                setSentInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
            });

            return () => {
                unsubRiders();
                unsubInvites();
            };
        }
    }, [subTab, vendorId]);

    const handleInvite = async (riderId: string) => {
        if (!currentVendor) return;
        try {
            await addDoc(collection(db, 'invitations'), {
                type: 'team_join',
                fromVendorId: vendorId,
                fromVendorName: currentVendor.name,
                toDeliveryManId: riderId,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            toast.success(language === 'en' ? 'Invitation Sent!' : 'আমন্ত্রণ পাঠানো হয়েছে!');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send invitation");
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await deleteDoc(doc(db, 'invitations', inviteId));
            toast.success("Invitation Cancelled");
        } catch (error) {
            toast.error("Failed to cancel");
        }
    };

    const handleRemoveMember = async (riderId: string) => {
        if (!confirm(language === 'en' ? 'Remove this member from your team?' : 'এই সদস্যকে আপনার দল থেকে সরিয়ে দেবেন?')) return;
        try {
            await updateDoc(doc(db, 'vendors', riderId), {
                vendorId: null
            });
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TruckIcon className="w-6 h-6 text-rose-500" />
                    {language === 'en' ? 'Logistics Management' : 'লজিস্টিক ব্যবস্থাপনা'}
                </h2>
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setSubTab('team')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'team' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {language === 'en' ? 'My Team' : 'আমার দল'}
                    </button>
                    <button
                        onClick={() => setSubTab('recruit')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'recruit' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {language === 'en' ? 'Recruit / Hire' : 'নিয়োগ করুন'}
                    </button>
                </div>
            </div>

            {subTab === 'team' ? (
                <div>
                    {myTeam.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">{language === 'en' ? 'No delivery men in your team.' : 'আপনার দলে কোন ডেলিভারি ম্যান নেই।'}</p>
                            <button onClick={() => setSubTab('recruit')} className="mt-4 text-rose-500 hover:underline font-medium">
                                {language === 'en' ? 'Recruit someone now' : 'এখনই কাউকে নিয়োগ করুন'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myTeam.map(man => (
                                <div key={man.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRemoveMember(man.id)}
                                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                            title="Remove from team"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <img src={man.logo || `https://ui-avatars.com/api/?name=${man.name?.en}`} className="w-14 h-14 rounded-full object-cover" />
                                        <div className="w-full">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-lg">{man.name?.en}</h3>
                                                <button onClick={async () => {
                                                    const threadId = await startChat(man.id);
                                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                }} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Chat with Team Member">
                                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500">{man.phone}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${man.onlineStatus === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{man.onlineStatus || 'OFFLINE'}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-yellow-500">
                                                <StarIcon className="w-3 h-3" />
                                                <span>{man.deliveryManProfile?.rating || 0} ({man.deliveryManProfile?.totalDeliveries || 0})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
                        <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{language === 'en'
                            ? "These are independent delivery men available for hire. Sending an invitation does not add them immediately; they must accept your invitation."
                            : "এরা ভাড়ার জন্য উপলব্ধ স্বাধীন ডেলিভারি ম্যান। আমন্ত্রণ পাঠালে তারা তাৎক্ষণিকভাবে যুক্ত হয় না; তাদের আপনার আমন্ত্রণ গ্রহণ করতে হবে।"}</p>
                    </div>

                    {loading ? <p className="text-center py-8">Loading available riders...</p> : availableRiders.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No independent riders available.</p>
                    ) : (
                        <div className="space-y-4">
                            {availableRiders.map(rider => {
                                const existingInvite = sentInvites.find(i => i.toDeliveryManId === rider.id);
                                return (
                                    <div key={rider.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src={rider.logo || `https://ui-avatars.com/api/?name=${rider.name?.en}`} className="w-12 h-12 rounded-full object-cover" />
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-gray-200">{rider.name?.en}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{rider.phone}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-yellow-500"><StarIcon className="w-3 h-3" /> {rider.deliveryManProfile?.rating || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {existingInvite ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                                                    {language === 'en' ? 'Invitation Sent' : 'আমন্ত্রণ পাঠানো হয়েছে'}
                                                </span>
                                                <button
                                                    onClick={() => handleCancelInvite(existingInvite.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                    title="Cancel Invite"
                                                >
                                                    <XIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleInvite(rider.id)}
                                                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                {language === 'en' ? 'Invite to Team' : 'দলে আমন্ত্রণ জানান'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VendorLogisticsTab;
