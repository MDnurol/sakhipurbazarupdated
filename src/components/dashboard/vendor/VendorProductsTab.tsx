import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/src/context/AppContext';
import { Product } from '@/types';
import { PlusIcon, SearchIcon, FilterIcon, ArchiveBoxIcon, PencilIcon, TrashIcon, PhotoIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, QuestionMarkCircleIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface VendorProductsTabProps {
    vendorId: string;
}

const VendorProductsTab: React.FC<VendorProductsTabProps> = ({ vendorId }) => {
    const { language, products, deleteProduct, updateProductStatus } = useApp();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE = 10;

    const vendorProducts = products.filter(p => p.vendorId === vendorId);

    const totalPages = Math.ceil(vendorProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = vendorProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

    const getStatusChip = (status: Product['status']) => {
        const styleMap: { [key in NonNullable<Product['status']>]: string } = {
            Approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
            Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
            Rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
            ReviewRequested: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styleMap[status || 'Pending']}`}>{status || 'Pending'}</span>;
    };

    const handleResubmit = async (product: Product) => {
        if (!confirm(language === 'en' ? 'Resubmit this product for approval?' : 'এই পণ্যটি অনুমোদনের জন্য পুনরায় জমা দেবেন?')) return;
        try {
            await updateProductStatus(product.id, 'Pending');
            toast.success(language === 'en' ? 'Product resubmitted!' : 'পণ্য পুনরায় জমা দেওয়া হয়েছে!');
        } catch (error) {
            console.error("Resubmit failed", error);
            toast.error("Failed to resubmit product");
        }
    };

    const showReason = (product: Product) => {
        const reason = product.rejectionReason || product.reviewRequestReason || 'No details provided.';
        const title = product.status === 'Rejected' ? 'Rejection Reason' : 'Review Request Note';
        toast((t) => (
            <div className="max-w-md">
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{reason}</p>
                <div className="mt-2 text-xs text-gray-400">ID: {product.id}</div>
            </div>
        ), { duration: 5000, icon: <QuestionMarkCircleIcon className="w-6 h-6 text-blue-500" /> });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'My Products' : 'আমার পণ্য'}</h2>
                <button onClick={() => navigate('/add-product')} className="bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 text-sm">{language === 'en' ? 'Add New Product' : 'নতুন পণ্য যোগ করুন'}</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">{language === 'en' ? 'Product' : 'পণ্য'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Price' : 'মূল্য'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Stock' : 'স্টক'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Status' : 'স্ট্যাটাস'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Actions' : 'ক্রিয়াকলাপ'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map(product => (
                            <tr key={product.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                    <img src={product.images[0]} alt={product.name[language]} className="w-10 h-10 rounded-md object-cover" />
                                    <span>{product.name[language]}</span>
                                </td>
                                <td className="px-6 py-4">৳{product.price}</td>
                                <td className="px-6 py-4">{product.stock}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusChip(product.status)}
                                        {(product.status === 'Rejected' || product.status === 'ReviewRequested') && (
                                            <button
                                                onClick={() => showReason(product)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                title={language === 'en' ? 'View Reason' : 'কারণ দেখুন'}
                                            >
                                                <QuestionMarkCircleIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    <button onClick={() => navigate(`/edit-product/${product.id}`)} className="text-blue-500 hover:text-blue-700" title="Edit">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    {(product.status === 'Rejected' || product.status === 'ReviewRequested') && (
                                        <button
                                            onClick={() => handleResubmit(product)}
                                            className="text-green-500 hover:text-green-700"
                                            title={language === 'en' ? 'Resubmit for Approval' : 'অনুমোদনের জন্য পুনরায় জমা দিন'}
                                        >
                                            <ArrowPathIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:text-red-700" title="Delete">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

export default VendorProductsTab;
