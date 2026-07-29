import { Clock, HelpCircle, Calendar, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { type Quiz } from "@/types/quiz.types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export const QuizCard = ({ quiz }: { quiz: Quiz }) => {
    const navigate = useNavigate();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="group flex flex-col h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg leading-tight line-clamp-2 group-hover:text-emerald-500 transition-colors">
                        {quiz.name}
                    </h3>
                    {/* <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                        Course: {quiz.course_title}
                    </p> */}
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5 -mr-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <MoreVertical size={18} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => navigate(`/staff/dashboard/quizzes/${quiz.id}`)} className="cursor-pointer gap-2">
                            <Eye size={16} className="text-zinc-500" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/staff/dashboard/quizzes/${quiz.id}/edit`)} className="cursor-pointer gap-2">
                            <Edit size={16} className="text-blue-500" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:bg-red-50 focus:text-red-700">
                            <Trash2 size={16} /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 grow">
                {quiz.description || "No description provided for this quiz."}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <HelpCircle size={16} className="text-emerald-500" />
                    <span className="font-semibold">{quiz.questions_count} <span className="font-normal text-zinc-500 text-xs">Qs</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <Clock size={16} className="text-emerald-500" />
                    <span className="font-semibold">{quiz.time_limit} <span className="font-normal text-zinc-500 text-xs">mins</span></span>
                </div>
            </div>

            {/* Footer Dates */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Opens: {formatDate(quiz.time_open)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar size={12} />
                        <span>Closes: {formatDate(quiz.time_close)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};