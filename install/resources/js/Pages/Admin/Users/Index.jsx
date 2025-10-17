import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function UsersIndex({ users, roles, blockedUsers = {}, blockedIps = {} }) {
    const [editingId, setEditingId] = useState(null);
    
    // Translations
    const t = {
        title: 'İstifadəçi Idarəsi',
        name: 'Ad',
        email: 'Email',
        role: 'Rol',
        joined: 'Qoşulma Tarixi',
        actions: 'Əməliyyat',
        edit: 'Redaktə Et',
        save: 'Saxla',
        cancel: 'Ləğv Et',
        admin: 'Admin',
        user: 'İstifadəçi',
        chatLimits: 'Çatbot Limitləri',
        dailyLimit: 'Günlük Limit',
        monthlyLimit: 'Aylıq Limit',
        unlimitedAccess: 'Məhdudiyyətsiz giriş',
        resetLimits: 'Limitləri sıfırla',
        currentLimits: 'Cari Limitlər',
        noLimitsSet: 'Limit təyin edilməyib'
    };

    return (
        <AdminLayout>
            <Head title={t.title} />
            
            <div className="p-3 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-gray-100">{t.title}</h1>
                
                {/* Desktop Table View */}
                <div className="hidden lg:block backdrop-blur bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.name}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.email}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.role}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.chatLimits}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.joined}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {users.data.map(user => (
                                <UserRow 
                                    key={user.id} 
                                    user={user} 
                                    roles={roles}
                                    isEditing={editingId === user.id}
                                    onEdit={() => setEditingId(user.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSaved={() => setEditingId(null)}
                                    t={t}
                                    viewMode="desktop"
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 overflow-x-hidden">
                    {users.data.map(user => (
                        <UserRow 
                            key={user.id} 
                            user={user} 
                            roles={roles}
                            isEditing={editingId === user.id}
                            onEdit={() => setEditingId(user.id)}
                            onCancel={() => setEditingId(null)}
                            onSaved={() => setEditingId(null)}
                            t={t}
                            viewMode="mobile"
                        />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}

function UserRow({ user, roles, isEditing, onEdit, onCancel, onSaved, t, viewMode = 'desktop' }) {
    const initialLimitType = user.daily_limit ? 'daily' : (user.monthly_limit ? 'monthly' : 'daily');
    const { data, setData, patch, processing, delete: destroy, post } = useForm({
        name: user.name,
        role_id: user.role_id,
        daily_limit: user.daily_limit || null,
        monthly_limit: user.monthly_limit || null,
        limit_type: initialLimitType,
        unlimited_access: user.unlimited_access || false,
        reset_limits: false,
    });

    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockData, setBlockData] = useState({ block_account: true, block_ip: false, ip_address: user.registration_ip || '', reason: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(`/admin/users/${user.id}`, { onSuccess: () => onSaved() });
    };

    // Mobile card view
    if (viewMode === 'mobile') {
        if (isEditing) {
            return (
                <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-4 w-full">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg mb-4 truncate">{t.edit}: {user.name}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                            <input type="text" value={data.name} onChange={e=>setData('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                        </div>
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                            <input type="email" value={user.email} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400" disabled />
                        </div>
                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
                            <select value={data.role_id} onChange={e=>setData('role_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                {roles.map(role => (<option key={role.id} value={role.id}>{role.name === 'admin' ? t.admin : t.user}</option>))}
                            </select>
                        </div>

                        {/* Limits */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4 space-y-3">
                            <div>
                                <label className="flex items-center">
                                    <input type="checkbox" checked={data.unlimited_access} onChange={e=>setData('unlimited_access', e.target.checked)} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mr-2" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.unlimitedAccess}</span>
                                </label>
                            </div>
                            {!data.unlimited_access && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={()=>setData('limit_type','daily')} className={`px-3 py-1.5 rounded-full text-sm border transition ${data.limit_type==='daily' ? 'bg-emerald-500 text-white border-emerald-500 shadow' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>Günlük</button>
                                        <button type="button" onClick={()=>setData('limit_type','monthly')} className={`px-3 py-1.5 rounded-full text-sm border transition ${data.limit_type==='monthly' ? 'bg-emerald-500 text-white border-emerald-500 shadow' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>Aylıq</button>
                                    </div>
                                    {data.limit_type === 'daily' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.dailyLimit}</label>
                                            <input type="number" value={data.daily_limit || ''} onChange={e=>setData('daily_limit', e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" min="1" placeholder="Sistem limiti" />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.monthlyLimit}</label>
                                            <input type="number" value={data.monthly_limit || ''} onChange={e=>setData('monthly_limit', e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" min="1" placeholder="Sistem limiti" />
                                        </div>
                                    )}
                                </>
                            )}
                            <div>
                                <label className="flex items-center">
                                    <input type="checkbox" checked={data.reset_limits} onChange={e=>setData('reset_limits', e.target.checked)} className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 mr-2" />
                                    <span className="text-sm text-red-600 dark:text-red-400">{t.resetLimits}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <button type="submit" disabled={processing} className="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">{processing ? '...' : t.save}</button>
                            <button type="button" onClick={onCancel} className="w-full sm:w-auto px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">{t.cancel}</button>
                        </div>
                    </form>
                </div>
            );
        }

        // Non-edit mobile card
        return (
            <div className="backdrop-blur bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 p-4 w-full">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg truncate">{user.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={onEdit} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium text-sm px-2 py-1 rounded flex-shrink-0">{t.edit}</button>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t.role}:</span>
                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${user.role?.name === 'admin' ? 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'}`}>{user.role?.name === 'admin' ? t.admin : t.user}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t.joined}:</span>
                        <span className="text-gray-900 dark:text-gray-100 text-right flex-shrink-0">{new Date(user.created_at).toLocaleDateString('az-AZ')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t.currentLimits}:</span>
                        <span className="text-right flex-shrink-0">
                            {user.unlimited_access ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">Məhdudiyyətsiz</span>
                            ) : (
                                <span className="text-xs text-gray-600 dark:text-gray-400">{user.daily_limit || 'Sistem'} gündəlik / {user.monthly_limit || 'Sistem'} aylıq</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop table view
    if (isEditing) {
        return (
            <>
            <tr>
                <td colSpan="6" className="px-6 py-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                                <input type="text" value={data.name} onChange={e=>setData('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                                <input type="email" value={user.email} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400" disabled />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
                                <select value={data.role_id} onChange={e=>setData('role_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    {roles.map(role => (<option key={role.id} value={role.id}>{role.name === 'admin' ? t.admin : t.user}</option>))}
                                </select>
                            </div>
                        </div>

                        {/* Chat Limits */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{t.chatLimits}</h4>
                            <div className="flex items-center gap-2 mb-3">
                                <button type="button" onClick={()=>setData('limit_type','daily')} className={`px-3 py-1.5 rounded-full text-sm border transition ${data.limit_type==='daily' ? 'bg-emerald-500 text-white border-emerald-500 shadow' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>Günlük</button>
                                <button type="button" onClick={()=>setData('limit_type','monthly')} className={`px-3 py-1.5 rounded-full text-sm border transition ${data.limit_type==='monthly' ? 'bg-emerald-500 text-white border-emerald-500 shadow' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}>Aylıq</button>
                                <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Cari: {data.limit_type==='monthly' ? (data.monthly_limit||'-')+' aylıq' : (data.daily_limit||'-')+' günlük'}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={data.unlimited_access} onChange={e=>setData('unlimited_access', e.target.checked)} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mr-2" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{t.unlimitedAccess}</span>
                                    </label>
                                </div>
                                {!data.unlimited_access && (
                                    <>
                                        {data.limit_type === 'daily' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.dailyLimit}</label>
                                                <input type="number" value={data.daily_limit || ''} onChange={e=>setData('daily_limit', e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" min="1" placeholder="Sistem limiti" />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.monthlyLimit}</label>
                                                <input type="number" value={data.monthly_limit || ''} onChange={e=>setData('monthly_limit', e.target.value ? parseInt(e.target.value) : null)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" min="1" placeholder="Sistem limiti" />
                                            </div>
                                        )}
                                    </>
                                )}
                                <div>
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={data.reset_limits} onChange={e=>setData('reset_limits', e.target.checked)} className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 mr-2" />
                                        <span className="text-sm text-red-600 dark:text-red-400">{t.resetLimits}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 items-center flex-wrap">
                            <button type="submit" disabled={processing} className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">{processing ? '...' : t.save}</button>
                            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">{t.cancel}</button>

                            {/* Block account/IP */}
                            <button type="button" onClick={()=>setShowBlockModal(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">Blok et</button>
                            {/* Delete account */}
                            <button type="button" onClick={()=>{ if(confirm('Bu hesabı silmək istədiyinizdən əminsiniz?')){ destroy(`/admin/users/${user.id}`); } }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">Hesabı sil</button>
                        </div>
                    </form>
                </td>
            </tr>

            {showBlockModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Hesabı/IP-ni blok et</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Səbəb (opsional)</label>
                                <textarea value={blockData.reason} onChange={e=>setBlockData({ ...blockData, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" rows={3} placeholder="Bloklama səbəbini qeyd edin..." />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={blockData.block_account} onChange={e=>setBlockData({ ...blockData, block_account: e.target.checked })} /><span className="text-sm text-gray-700 dark:text-gray-300">Hesabı blok et</span></label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={blockData.block_ip} onChange={e=>setBlockData({ ...blockData, block_ip: e.target.checked })} /><span className="text-sm text-gray-700 dark:text-gray-300">IP ünvanını blok et</span></label>
                                {blockData.block_ip && (
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Ünvanı</label>
                                        <input type="text" value={blockData.ip_address} onChange={e=>setBlockData({ ...blockData, ip_address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="məs: 192.168.1.1" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-6">
                            <button type="button" onClick={()=>setShowBlockModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg">Bağla</button>
                            <button type="button" onClick={()=>{ post(`/admin/users/${user.id}/block`, blockData, { onSuccess: ()=>setShowBlockModal(false) }); }} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">Təsdiqlə</button>
                        </div>
                    </div>
                </div>
            )}
            </>
        );
    }

    // Non-edit desktop row
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${user.role?.name === 'admin' ? 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'}`}>{user.role?.name === 'admin' ? t.admin : t.user}</span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {user.unlimited_access ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">Məhdudiyyətsiz</span>
                ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{user.daily_limit || 'Sistem'} gündəlik<br/>{user.monthly_limit || 'Sistem'} aylıq</span>
                )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(user.created_at).toLocaleDateString('az-AZ')}</td>
            <td className="px-6 py-4 text-right">
                <button onClick={onEdit} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium transition-colors">{t.edit}</button>
            </td>
        </tr>
    );
}
