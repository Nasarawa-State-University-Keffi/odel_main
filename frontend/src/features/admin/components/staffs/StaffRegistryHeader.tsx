import { Search, UserCog, ListFilter, UserCheck, Loader2, GraduationCap, Building2, Landmark } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Faculty, Department } from "../../services/staffService";
import { useQuery } from "@tanstack/react-query";
import { facultyService } from "../../services/facultyService";

interface StaffRegistryHeaderProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    debouncedSearch: string;
    isLoading: boolean;

    // Filter Props
    faculties: Faculty[];
    selectedFaculty: string;
    onFacultyChange: (val: string) => void;

    departments: Department[];
    selectedDepartment: string;
    onDepartmentChange: (val: string) => void;

    showLevelAdvisers: boolean;
    onShowLevelAdvisersChange: (val: boolean) => void;

    showSenateMembers: boolean;
    onShowSenateMembersChange: (val: boolean) => void;
}

const StaffRegistryHeader = ({
    searchQuery,
    onSearchChange,
    debouncedSearch,
    isLoading,
    faculties,
    selectedFaculty,
    onFacultyChange,
    departments,
    selectedDepartment,
    onDepartmentChange,
    showLevelAdvisers,
    onShowLevelAdvisersChange,
    showSenateMembers,
    onShowSenateMembersChange
}: StaffRegistryHeaderProps) => {
    // Fetch Exam Officer when a faculty is selected
    const { data: examOfficer, isPending: isLoadingOfficer } = useQuery({
        queryKey: ["exam-officer", selectedFaculty],
        queryFn: () => facultyService.getExamOfficer(Number(selectedFaculty)),
        enabled: selectedFaculty !== "all" && !isNaN(Number(selectedFaculty)),
    });

    return (
        <CardHeader className="pb-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 flex-none sticky top-0">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                        <UserCog className="h-6 w-6 text-primary" />
                        Official Registry
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Comprehensive list of registered ODEL personnel
                    </CardDescription>
                </div>
                <div className="flex flex-row gap-3 w-full md:w-auto items-center">
                    {/* Filter Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-11 px-4 gap-2 border-border/50 bg-background/50 relative">
                                <ListFilter className="h-4 w-4" />
                                <span className="hidden sm:inline font-bold text-xs uppercase tracking-wide">Filters</span>
                                {(selectedFaculty !== "all" || selectedDepartment !== "all" || showLevelAdvisers || showSenateMembers) && (
                                    <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full ml-1 absolute -top-1 -right-1">
                                        {(selectedFaculty !== "all" ? 1 : 0) + (selectedDepartment !== "all" ? 1 : 0) + (showLevelAdvisers ? 1 : 0) + (showSenateMembers ? 1 : 0)}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20" align="end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Filter Staff List</h4>
                                    {(selectedFaculty !== "all" || selectedDepartment !== "all" || showLevelAdvisers || showSenateMembers) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                if (onFacultyChange) onFacultyChange("all");
                                                if (onShowLevelAdvisersChange) onShowLevelAdvisersChange(false);
                                                if (onShowSenateMembersChange) onShowSenateMembersChange(false);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {/* Faculty Filter */}
                                    {faculties.length > 0 && (
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Faculty</Label>
                                            <Select value={selectedFaculty} onValueChange={onFacultyChange}>
                                                <SelectTrigger className="h-10 bg-background text-xs font-medium">
                                                    <SelectValue placeholder="All Faculties" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px]">
                                                    <SelectItem value="all" className="text-xs font-bold uppercase tracking-wide">All Faculties</SelectItem>
                                                    {faculties.map((faculty) => (
                                                        <SelectItem key={faculty.id} value={faculty.id.toString()} className="text-xs font-bold uppercase tracking-wide">
                                                            {faculty.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Exam Officer Info */}
                                    {selectedFaculty !== "all" && (
                                        <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">Exam Officer (Dean)</Label>
                                            {isLoadingOfficer ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                                    <span className="text-[10px] font-bold text-muted-foreground">Fetching officer details...</span>
                                                </div>
                                            ) : examOfficer ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <GraduationCap className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-900 leading-tight">
                                                                {examOfficer.professionalTitle} {examOfficer.user.firstName} {examOfficer.user.lastName}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/70 uppercase">
                                                                {examOfficer.title.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 pl-9">
                                                        <Building2 className="h-2.5 w-2.5 text-muted-foreground/60" />
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                            {examOfficer.department.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-amber-600/70 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                                    No Exam Officer assigned to this faculty
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Department Filter */}
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</Label>
                                        <Select
                                            value={selectedDepartment}
                                            onValueChange={onDepartmentChange}
                                            disabled={!departments.length}
                                        >
                                            <SelectTrigger className="h-10 bg-background text-xs font-medium">
                                                <SelectValue placeholder="All Departments" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                <SelectItem value="all" className="text-xs font-bold uppercase tracking-wide">All Departments</SelectItem>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()} className="text-xs font-bold uppercase tracking-wide">
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Level Advisers Toggle */}
                                    {selectedDepartment !== "all" && (
                                        <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                                            <Checkbox
                                                id="level-advisers"
                                                checked={showLevelAdvisers}
                                                onCheckedChange={(checked) => onShowLevelAdvisersChange(checked as boolean)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor="level-advisers"
                                                    className="text-xs font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                                                    Show Level Advisers Only
                                                </Label>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    Filter list to show only appointed level advisers.
                                                </p>
                                            </div>
                                        </div>

                                    )}

                                    {/* Senate Members Toggle */}
                                    <div className="flex items-center space-x-2 pt-2 border-t border-border/50">
                                        <Checkbox
                                            id="senate-members"
                                            checked={showSenateMembers}
                                            onCheckedChange={(checked) => onShowSenateMembersChange(checked as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="senate-members"
                                                className="text-xs font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1.5"
                                            >
                                                <Landmark className="h-3.5 w-3.5 text-primary" />
                                                Show Senate Members
                                            </Label>
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                Filter list to show only Senate members.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="relative flex-1 sm:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="search"
                            placeholder="Search by name, ID or email..."
                            className="pl-11 h-11 bg-background/50 border-border/50 focus:ring-primary/20 rounded-xl transition-all"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {(isLoading || searchQuery !== debouncedSearch) && searchQuery !== "" && (
                            <Loader2 className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                        )}
                    </div>
                </div>
            </div>
        </CardHeader >
    );
};

export default StaffRegistryHeader;
