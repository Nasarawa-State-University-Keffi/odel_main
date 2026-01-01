import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { facultyService } from "@/features/admin/services/facultyService";
import { departmentService } from "@/features/admin/services/departmentService";
import { programmeTypeService } from "@/features/admin/services/programmeTypeService";
import { staffService } from "@/features/admin/services/staffService";
import { CourseQueryParams } from "@/features/admin/types/course";
import { X } from "lucide-react";

interface CourseFilterBarProps {
    onFilterChange: (filters: CourseQueryParams) => void;
}

const CourseFilterBar = ({ onFilterChange }: CourseFilterBarProps) => {
    const [filters, setFilters] = useState<Partial<CourseQueryParams>>({
        programme_type: undefined,
        department: undefined,
        faculty: undefined,
        level: undefined,
        strict: false
    });

    // Fetch Dependencies
    const { data: faculties = [] } = useQuery({
        queryKey: ["faculties"],
        queryFn: facultyService.getAllFaculties,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: departmentService.getAllDepartments,
    });

    const { data: levels = [] } = useQuery({
        queryKey: ["levels"],
        queryFn: async () => [
            { id: 1, name: "100 Level" },
            { id: 2, name: "200 Level" },
            { id: 3, name: "300 Level" },
            { id: 4, name: "400 Level" },
            { id: 5, name: "500 Level" },
        ],
    });

    const { data: programmeTypes = [] } = useQuery({
        queryKey: ["programmeTypes"],
        queryFn: programmeTypeService.getAllProgrammeTypes
    });

    // Handle Filter Changes
    const handleChange = (key: keyof CourseQueryParams, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // Only emit if at least programme_type is selected (as it is required by backend usually, 
        // or we can enforce it here before emitting)
        if (newFilters.programme_type) {
            onFilterChange(newFilters as CourseQueryParams);
        }
    };

    const clearFilters = () => {
        const resetFilters = {
            programme_type: undefined,
            department: undefined,
            faculty: undefined,
            level: undefined,
            strict: false
        };
        setFilters(resetFilters);
        // We might not want to emit empty filters if API requires programme_type
    };

    // Filter departments based on selected faculty if any
    const filteredDepartments = filters.faculty
        ? departments.filter((d: any) => d.faculty.id === filters.faculty)
        : departments;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-card shadow-sm animate-in fade-in slide-in-from-top-2">

            {/* Programme Type (Required) */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Programme Type</Label>
                <Select
                    value={filters.programme_type?.toString()}
                    onValueChange={(v) => handleChange('programme_type', parseInt(v))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {programmeTypes.map((pt: any) => (
                            <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Faculty */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Faculty</Label>
                <Select
                    value={filters.faculty?.toString()}
                    onValueChange={(v) => handleChange('faculty', parseInt(v))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Faculties" />
                    </SelectTrigger>
                    <SelectContent>
                        {faculties.map((f: any) => (
                            <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Department</Label>
                <Select
                    value={filters.department?.toString()}
                    onValueChange={(v) => handleChange('department', parseInt(v))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredDepartments.map((d: any) => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Level</Label>
                <Select
                    value={filters.level?.toString()}
                    onValueChange={(v) => handleChange('level', parseInt(v))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        {levels.map((l: any) => (
                            <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Actions */}
            <div className="flex items-end pb-0.5">
                <Button
                    variant="outline"
                    className="w-full text-muted-foreground"
                    onClick={clearFilters}
                    disabled={!filters.programme_type && !filters.faculty && !filters.department && !filters.level}
                >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                </Button>
            </div>
        </div>
    );
};

export default CourseFilterBar;
