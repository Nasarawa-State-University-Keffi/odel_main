import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface StudentPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const StudentPagination = ({ currentPage, totalPages, onPageChange }: StudentPaginationProps) => {
    if (totalPages <= 1) return null;

    const renderPaginationItems = () => {
        const items = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => onPageChange(i)}
                            className={`cursor-pointer h-10 w-10 rounded-xl transition-all ${currentPage === i ? "shadow-lg shadow-primary/20 font-bold" : ""}`}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            return items;
        }

        items.push(
            <PaginationItem key={1}>
                <PaginationLink
                    isActive={currentPage === 1}
                    onClick={() => onPageChange(1)}
                    className="cursor-pointer h-10 w-10 rounded-xl transition-all"
                >
                    1
                </PaginationLink>
            </PaginationItem>
        );

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        if (start > 2) {
            items.push(
                <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        for (let i = start; i <= end; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        isActive={currentPage === i}
                        onClick={() => onPageChange(i)}
                        className={`cursor-pointer h-10 w-10 rounded-xl transition-all ${currentPage === i ? "shadow-lg shadow-primary/20 font-bold" : ""}`}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (end < totalPages - 1) {
            items.push(
                <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        items.push(
            <PaginationItem key={totalPages}>
                <PaginationLink
                    isActive={currentPage === totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="cursor-pointer h-10 w-10 rounded-xl transition-all"
                >
                    {totalPages}
                </PaginationLink>
            </PaginationItem>
        );

        return items;
    };

    return (
        <div className="p-3 md:p-6 border-t border-border/50 bg-muted/5 flex-none overflow-x-auto">
            <Pagination>
                <PaginationContent className="gap-2">
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => onPageChange(currentPage - 1)}
                            className={`rounded-xl h-10 px-4 transition-all ${currentPage === 1 ? "pointer-events-none opacity-40 grayscale" : "cursor-pointer hover:bg-background shadow-sm border"}`}
                        />
                    </PaginationItem>
                    <div className="hidden sm:flex items-center gap-1.5 px-2">
                        {renderPaginationItems()}
                    </div>
                    <PaginationItem>
                        <PaginationNext
                            onClick={() => onPageChange(currentPage + 1)}
                            className={`rounded-xl h-10 px-4 transition-all ${currentPage === totalPages ? "pointer-events-none opacity-40 grayscale" : "cursor-pointer hover:bg-background shadow-sm border"}`}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default StudentPagination;
