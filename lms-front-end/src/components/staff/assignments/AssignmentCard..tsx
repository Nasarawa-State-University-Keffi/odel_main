import React from "react";
import { Calendar, Clock, FileText, MoreVertical, Edit, Trash, Users } from "lucide-react";
import type { Assignment } from "@/types/assignment.types";

interface Props {
  assignment: Assignment;
}

export const AssignmentCard: React.FC<Props> = ({ assignment }) => {
  const isPublished = assignment.is_published;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <div className="flex flex-col justify-between bg-surface border border-border-subtle rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-300 group">
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isPublished ? 'bg-secondary-100 text-secondary-600' : 'bg-gray-100 text-gray-600'}`}>
            {isPublished ? "Published" : "Draft"}
          </span>
          <button className="text-text-muted hover:text-primary-600 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>

        <h3 className="text-lg font-heading text-text-main mb-1 line-clamp-1" title={assignment.title}>
          {assignment.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-primary-600 font-medium mb-3">
          <FileText size={14} />
          <span>{assignment.course.course_code}</span>
        </div>

        <p className="text-sm text-text-muted line-clamp-2 mb-4">
          {assignment.description || "No description provided."}
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-text-muted">
            <Calendar size={14} className="mr-2" />
            <span>Due: {formatDate(assignment.due_at)}</span>
          </div>
          <div className="flex items-center text-sm text-text-muted">
            <Clock size={14} className="mr-2" />
            <span>Marks: {parseFloat(assignment.max_marks).toFixed(0)} pts</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-text-main bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <Users size={14} /> Submissions
        </button>
        <div className="flex gap-1">
          <button className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
            <Edit size={16} />
          </button>
          <button className="p-2 text-text-muted hover:text-destructive hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};