import { useEffect, useState } from "react";
import { Search, AlertCircle, FileText, CheckCircle, Clock, ChevronRight, FileDown } from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { SubmissionEmptyState, SubmissionLoadingState } from "@/components/staff/submissions/SubmissionStates";
import type { Submission } from "@/types/assignment.types";
import { useStaffSubmission } from "@/service/useStaffSubmission";
import { useNavigate } from "react-router-dom";

const StaffAssessmentSubmissionsPage = () => {
  const { fetchSubmissions, isPending, submissionsData, submissionsError } = useStaffSubmission();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate()

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSubmissions({ search: searchTerm });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'graded':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-600 border border-secondary-200"><CheckCircle size={12} className="mr-1" /> Graded</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200"><Clock size={12} className="mr-1" /> Needs Grading</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{status}</span>;
    }
  };

  const renderMobileCard = (submission: Submission) => (
    <div key={submission.id} className="bg-surface border border-border-subtle rounded-lg p-4 mb-4 shadow-sm md:hidden">
      <div className="flex justify-between items-start mb-3">
        <div className="font-heading text-text-main">{submission.student_external_id || "Unknown Student"}</div>
        {renderStatusBadge(submission.status)}
      </div>
      <div className="space-y-2 text-sm text-text-muted mb-4">
        <div className="flex items-center gap-2">
          <FileText size={14} /> Attempt {submission.attempt_number}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} /> {formatDate(submission.submitted_at)}
        </div>
        <div className="text-text-main font-medium mt-2">
          Score: {submission.marks ? `${submission.marks} pts` : "—"}
        </div>
      </div>
      <button onClick={() => navigate(`/staff/dashboard/assessment-submissions/submissions/${submission.id}`)} className="w-full flex items-center justify-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-600 px-4 py-2 rounded-md transition-colors text-sm font-medium">
        Review Submission <ChevronRight size={16} />
      </button>
    </div>
  );

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <AnimateIn direction="left">
          <h1 className="text-2xl md:text-3xl font-heading text-text-main">Submissions</h1>
          <p className="text-text-muted text-sm mt-1">Review and grade student assignments.</p>
        </AnimateIn>

        <AnimateIn direction="right" className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border-subtle text-text-main px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
            <FileDown size={16} /> Export CSV
          </button>
        </AnimateIn>
      </div>

      {/* Error State */}
      {submissionsError && !isPending && (
        <AnimateIn direction="down" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{submissionsError}</p>
        </AnimateIn>
      )}

      {/* Loading State */}
      {isPending && !submissionsData && <SubmissionLoadingState />}

      {/* Content */}
      {!isPending && submissionsData && (
        <AnimateIn direction="up" delay={0.1}>
          {submissionsData.results.length === 0 ? (
            <SubmissionEmptyState hasSearch={searchTerm.length > 0} />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-surface border border-border-subtle rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-text-main">
                    <thead className="bg-bg-base text-text-muted font-heading uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Student ID</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Attempt</th>
                        <th className="px-6 py-4 font-semibold">Files Attached</th>
                        <th className="px-6 py-4 font-semibold">Submitted Date</th>
                        <th className="px-6 py-4 font-semibold">Score</th>
                        <th className="px-6 py-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {submissionsData.results.map((sub) => (
                        <tr key={sub.id} className="hover:bg-surface-hover transition-colors">
                          <td className="px-6 py-4 font-medium">{sub.student_external_id || "—"}</td>
                          <td className="px-6 py-4">{renderStatusBadge(sub.status)}</td>
                          <td className="px-6 py-4">{sub.attempt_number}</td>
                          <td className="px-6 py-4">
                            {sub.files.length > 0 ? (
                              <span className="text-primary-600 font-medium">{sub.files.length} file(s)</span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-text-muted">{formatDate(sub.submitted_at)}</td>
                          <td className="px-6 py-4 font-medium">{sub.marks ? sub.marks : "—"}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => navigate(`/staff/dashboard/assessment-submissions/submissions/${sub.id}`)} className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1 transition-colors">
                              Review <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {submissionsData.results.map(renderMobileCard)}
              </div>
            </>
          )}
        </AnimateIn>
      )}
    </main>
  );
};

export default StaffAssessmentSubmissionsPage;