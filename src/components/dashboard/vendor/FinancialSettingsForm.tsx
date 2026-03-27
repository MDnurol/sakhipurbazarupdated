import React, { useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import { Vendor } from '@/types';
import toast from 'react-hot-toast';

interface FinancialSettingsFormProps {
    vendor: Vendor;
    language: 'en' | 'bn';
    onUpdate: () => void;
}

const FinancialSettingsForm: React.FC<FinancialSettingsFormProps> = ({ vendor, language, onUpdate }) => {
    const { updateVendor } = useApp();
    const settings = vendor.payoutSettings;

    const [method, setMethod] = useState(settings?.method || 'bKash');
    const [accountType, setAccountType] = useState(settings?.accountType || 'Personal');
    const [accountNumber, setAccountNumber] = useState(settings?.accountNumber || '');
    const [bankName, setBankName] = useState(settings?.bankDetails?.bankName || '');
    const [branchName, setBranchName] = useState(settings?.bankDetails?.branchName || '');
    const [accountName, setAccountName] = useState(settings?.bankDetails?.accountName || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateVendor(vendor.id, {
                payoutSettings: {
                    method: method as any,
                    accountType: accountType as any,
                    accountNumber,
                    bankDetails: method === 'Bank Transfer' ? { bankName, branchName, accountName } : undefined,
                    lastUpdated: new Date().toISOString()
                }
            });
            toast.success(language === 'en' ? 'Payout settings updated!' : 'পেমেন্ট সেটিংস আপডেট হয়েছে!');
            onUpdate();
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'en' ? 'Method' : 'পদ্ধতি'}
                    </label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                </div>
                {method !== 'Bank Transfer' && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {language === 'en' ? 'Account Type' : 'অ্যাকাউন্টের ধরন'}
                        </label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value as any)}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="Personal">Personal</option>
                            <option value="Agent">Agent</option>
                        </select>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'en' ? 'Account Number' : 'অ্যাকাউন্ট নম্বর'}
                </label>
                <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    placeholder="017..."
                    className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            {method === 'Bank Transfer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-700">
                    <input placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} required className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    <input placeholder="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} required className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    <input placeholder="Account Name" value={accountName} onChange={e => setAccountName(e.target.value)} required className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            )}

            <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg hover:shadow-blue-500/30"
            >
                {saving ? 'Saving...' : (language === 'en' ? 'Save Payout Details' : 'পেমেন্ট তথ্য সংরক্ষণ করুন')}
            </button>
        </form>
    );
};

export default FinancialSettingsForm;
