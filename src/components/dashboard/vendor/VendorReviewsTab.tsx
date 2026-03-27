import React, { useState, useEffect } from 'react';
import { useApp } from '@/src/context/AppContext';
import { UserReview } from '@/types';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { StarIcon, ShoppingBagIcon } from '@/components/icons';

interface VendorReviewsTabProps {
    vendorId: string;
}

const VendorReviewsTab: React.FC<VendorReviewsTabProps> = ({ vendorId }) => {
    const { language } = useApp();
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!vendorId) return;
        const q = query(
            collection(db, 'reviews'),
            where('vendorId', '==', vendorId),
            orderBy('date', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReview)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [vendorId]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading reviews...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Product Reviews' : 'পণ্যের রিভিউ সমূহ'}
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0">
                            <img src={review.customerImage} alt={review.customerName} className="w-12 h-12 rounded-full border-2 border-gray-100" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{review.customerName}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <StarIcon key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${review.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    review.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {review.status}
                                </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                {review.comment[language] || review.comment.en}
                            </p>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <ShoppingBagIcon className="w-3 h-3" />
                                Product ID: {review.productId}
                            </div>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <StarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews found</h3>
                        <p className="text-gray-500">Reviews for your products will appear here once customers submit them.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorReviewsTab;
