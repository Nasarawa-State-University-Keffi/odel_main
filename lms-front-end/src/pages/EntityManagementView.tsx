import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import type { Semester } from "@/types/academic.types";
import { entitySchema } from "@/types/admin.types";
import { AlertCircle, Edit2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { z } from "zod"

export default function EntityManagementView({ title, description, entityName, icon: Icon, api, data, setData }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ name: '' });
    const [formError, setFormError] = useState('');

    const handleOpenModal = (item = null) => {
        setFormError('');
        if (item) {
            setEditingItem(item);
            setFormData({ name: item.name });
        } else {
            setEditingItem(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');

        try {
            const validData = entitySchema.parse(formData);

            if (editingItem) {
                await api.updateItem(editingItem.id, validData);
                setData((prev: { results: Semester[] }) => ({
                    ...prev,
                    results: prev.results.map((item: Semester) =>
                        item.id === editingItem.id ? { ...item, ...validData } : item
                    )
                }));
            } else {
                const response = await api.createItem(validData);
                if (response.success) {
                    console.log("the session data: ", response.data)
                    setData((prev) => ({
                        ...prev,
                        count: prev.count + 1,
                        results: [...prev.results, response.data]
                    }));
                }
            }
            setIsModalOpen(false);
        } catch (error) {
            if (error instanceof z.ZodError) {
                setFormError(error.issues[0].message);
            }
        }
    };
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setDeletingId(itemToDelete.id);

        try {
            const response = await api.deleteItem(itemToDelete.id);

            if (response.success) {
                setData((prev) => ({
                    ...prev,
                    count: prev.count - 1,
                    results: prev.results.filter((item) => item.id !== itemToDelete.id)
                }));
                // Close the modal instantly on success
                setItemToDelete(null);
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Are you sure you want to delete this ${entityName.toLowerCase()}?`)) {

            setDeletingId(id);

            try {
                const response = await api.deleteItem(id);

                if (response.success) {
                    setData((prev) => ({
                        ...prev,
                        count: prev.count - 1,
                        results: prev.results.filter((item) => item.id !== id)
                    }));
                }
            } finally {
                setDeletingId(null);
            }
        }
    };
    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Icon size={24} className="text-indigo-600" />
                        {title}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{description}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                >
                    <Plus size={18} />
                    New {entityName}
                </button>
            </div>

            {/* Main Content Area */}
            {data?.results?.length === 0 ? (
                <EmptyState
                    title={`No ${title} Found`}
                    description={`Get started by creating your first ${entityName.toLowerCase()}. It will be available across the application.`}
                    onAdd={() => handleOpenModal()}
                    icon={Icon}
                />
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                                    <th className="px-6 py-4 font-medium">ID</th>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data?.results?.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-500 text-sm">#{item.id}</td>
                                        <td className="px-6 py-4 text-slate-800 font-medium">{item.name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item)}
                                                    disabled={deletingId === item.id}
                                                    className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete"
                                                >
                                                    {deletingId === item.id ? (
                                                        <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-sm text-slate-500 flex justify-between items-center">
                        <span>Showing {data?.results?.length} records</span>
                        {/* Pagination placeholder matching API docs */}
                        <div className="flex gap-2">
                            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Previous</button>
                            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50">Next</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? `Edit ${entityName}` : `Create New ${entityName}`}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                            {entityName} Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ name: e.target.value })}
                            placeholder={`e.g. ${entityName === 'Semester' ? 'First Semester' : '2023/2024'}`}
                            className={`w-full px-4 py-2.5 rounded-xl border ${formError ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'
                                } focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                            autoFocus
                        />
                        {formError && (
                            <p className="flex items-center gap-1 mt-2 text-sm text-red-500 animate-in slide-in-from-top-1">
                                <AlertCircle size={14} />
                                {formError}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={api.isPending}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {api.isPending && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            {editingItem ? 'Save Changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!itemToDelete}
                onClose={() => !deletingId && setItemToDelete(null)}
                title={`Delete ${entityName}`}
            >
                <div className="flex flex-col gap-5">
                    <div className="flex gap-4 p-4 bg-red-50 text-red-800 rounded-2xl border border-red-100/60">
                        <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-red-100 rounded-full text-red-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-red-900 text-sm">Destructive Action</h4>
                            <p className="text-sm text-red-700/90 mt-1 leading-relaxed">
                                Are you sure you want to delete <strong className="font-bold text-red-900">"{itemToDelete?.name}"</strong>? This action is permanent and will remove it entirely from the system.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            onClick={() => setItemToDelete(null)}
                            disabled={deletingId !== null}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            disabled={deletingId !== null}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-md hover:shadow-red-600/20 transition-all font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {deletingId !== null ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Yes, Delete'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}