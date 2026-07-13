import { Plus } from "lucide-react";

const EmptyState = ({ title, description, onAdd, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <Icon size={32} className="text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-500 max-w-sm mb-6">{description}</p>
        <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
            <Plus size={18} />
            Add First Record
        </button>
    </div>
);


export default EmptyState;