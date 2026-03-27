import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Product } from '@/types';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { PencilIcon, TrashIcon, ClockIcon, PlusIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface VendorDraftsTabProps {
    vendorId: string;
}

const VendorDraftsTab: React.FC<VendorDraftsTabProps> = ({ vendorId }) => {
    const { language } = useApp();
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'product_drafts'), where('vendorId', '==', vendorId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDrafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setDrafts(fetchedDrafts);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [vendorId]);

    const handleDeleteDraft = async (draftId: string) => {
        if (!confirm(language === 'en' ? 'Delete this draft?' : 'এই খসড়া মুছবেন?')) return;
        try {
            await deleteDoc(doc(db, 'product_drafts', draftId));
            toast.success("Draft deleted");
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete draft");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'Product Drafts' : 'পণ্য খসড়া'}</h2>
                <button onClick={() => navigate('/add-product')} className="bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 text-sm flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" /> {language === 'en' ? 'Create New Draft' : 'নতুন খসড়া তৈরি করুন'}
                </button>
            </div>
            {loading ? <p>Loading...</p> : drafts.length === 0 ? <p className="text-gray-500">No drafts found.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">{language === 'en' ? 'Draft Name' : 'খসড়া নাম'}</th>
                                <th className="px-6 py-3">{language === 'en' ? 'Last Updated' : 'সর্বশেষ আপডেট'}</th>
                                <th className="px-6 py-3">{language === 'en' ? 'Actions' : 'ক্রিয়াকলাপ'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.map(draft => (
                                <tr key={draft.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                        {draft.images?.[0] && <img src={draft.images[0]} className="w-8 h-8 rounded" />}
                                        {draft.name.en || 'Untitled'}
                                    </td>
                                    <td className="px-6 py-4">{draft.updatedAt ? new Date((draft.updatedAt as any).seconds ? (draft.updatedAt as any).seconds * 1000 : draft.updatedAt as string).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 flex gap-4">
                                        <button onClick={() => navigate(`/edit-product/${draft.id}`)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                            <PencilIcon className="w-5 h-5" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteDraft(draft.id)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VendorDraftsTab;
