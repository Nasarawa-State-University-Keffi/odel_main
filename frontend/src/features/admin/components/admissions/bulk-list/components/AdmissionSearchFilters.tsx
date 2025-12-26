import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Filter, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Faculty, Department, State, Gender, ProgrammeType, LGA, Level } from "@/features/admin/services/staffService";

interface AdmissionSearchFiltersProps {
    filters: {
        level: string;
        admission: string;
        faculty: string;
        department: string;
        programme: string;
        country: string;
        state: string;
        lga: string;
        gender: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    onSearch: () => void;
    loading: boolean;

    // Single Search Props
    applicantId: string;
    onApplicantIdChange: (value: string) => void;
    onSingleSearch: () => void;
    singleLoading: boolean;

    // Metadata
    faculties: Faculty[];
    departments: Department[];
    states: State[];
    genders: Gender[];
    programmes: ProgrammeType[];
    lgas: LGA[];
    levels: Level[];

    // Metadata Loading States
    loadingMetadata: boolean;
    loadingLgas: boolean;
    loadingLevels: boolean;
}

const AdmissionSearchFilters = ({
    filters,
    onFilterChange,
    onClearFilters,
    onSearch,
    loading,
    applicantId,
    onApplicantIdChange,
    onSingleSearch,
    singleLoading,
    faculties,
    departments,
    states,
    genders,
    programmes,
    lgas,
    levels,
    loadingMetadata,
    loadingLgas,
    loadingLevels
}: AdmissionSearchFiltersProps) => {
    return (
        <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
                <TabsTrigger value="quick">Quick Search</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Filter</TabsTrigger>
            </TabsList>

            {/* QUICK SEARCH TAB */}
            <TabsContent value="quick">
                <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                        <CardTitle className="text-sm font-black tracking-tight flex items-center gap-2 uppercase text-muted-foreground">
                            <Search className="h-4 w-4" />
                            Find Single Applicant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Applicant ID / Reg No</label>
                                <Input
                                    placeholder="e.g. 20230001"
                                    value={applicantId}
                                    onChange={(e) => onApplicantIdChange(e.target.value)}
                                    className="bg-background font-mono text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onSingleSearch();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={onSingleSearch} disabled={singleLoading || !applicantId} className="w-full sm:w-auto font-bold gap-2">
                                    {singleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Search
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ADVANCED FILTER TAB */}
            <TabsContent value="advanced">
                <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                        <CardTitle className="text-sm font-black tracking-tight flex items-center gap-2 uppercase text-muted-foreground">
                            <Filter className="h-4 w-4" />
                            Bulk Filter Criteria
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {/* ADMISSION ID */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Admission ID</label>
                                <Input
                                    placeholder="Enter ID..."
                                    value={filters.admission}
                                    onChange={(e) => onFilterChange("admission", e.target.value)}
                                    type="number"
                                    className="bg-background"
                                    disabled={true}
                                />
                            </div>

                            {/* FACULTY */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Faculty</label>
                                <Select value={filters.faculty} onValueChange={(val) => onFilterChange("faculty", val)} disabled={loadingMetadata}>
                                    <SelectTrigger className="bg-background">
                                        {loadingMetadata ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="All Faculties" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Faculties</SelectItem>
                                        {faculties.map(f => (
                                            <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* DEPARTMENT */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                                <Select value={filters.department} onValueChange={(val) => onFilterChange("department", val)} disabled={loadingMetadata}>
                                    <SelectTrigger className="bg-background">
                                        {loadingMetadata ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="All Departments" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PROGRAMME ID */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Programme</label>
                                <Select value={filters.programme} onValueChange={(val) => {
                                    onFilterChange("programme", val);
                                    onFilterChange("level", "");
                                }} disabled={loadingMetadata}>
                                    <SelectTrigger className="bg-background">
                                        {loadingMetadata ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="All Programmes" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Programmes</SelectItem>
                                        {programmes.map(p => (
                                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* LEVEL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Level</label>
                                <Select value={filters.level} onValueChange={(val) => onFilterChange("level", val)} disabled={!filters.programme || filters.programme === 'all' || loadingLevels}>
                                    <SelectTrigger className="bg-background">
                                        {loadingLevels ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder={filters.programme && filters.programme !== 'all' ? "Any Level" : "Select Programme First"} />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Level</SelectItem>
                                        {levels.map(l => (
                                            <SelectItem key={l.id} value={l.title}>{l.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* GENDER */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Gender</label>
                                <Select value={filters.gender} onValueChange={(val) => onFilterChange("gender", val)} disabled={loadingMetadata}>
                                    <SelectTrigger className="bg-background">
                                        {loadingMetadata ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Any Gender" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Gender</SelectItem>
                                        {genders.map(g => (
                                            <SelectItem key={g.id} value={g.id.toString()}>{g.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PROPS FOR LESSER USED FILTERS */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">State</label>
                                <Select value={filters.state} onValueChange={(val) => {
                                    onFilterChange("state", val);
                                    onFilterChange("lga", ""); // Clear LGA on state change
                                }} disabled={loadingMetadata}>
                                    <SelectTrigger className="bg-background">
                                        {loadingMetadata ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Select State" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All States</SelectItem>
                                        {states.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase">LGA</label>
                                <Select value={filters.lga} onValueChange={(val) => onFilterChange("lga", val)} disabled={!filters.state || loadingLgas}>
                                    <SelectTrigger className="bg-background">
                                        {loadingLgas ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <SelectValue placeholder={filters.state ? "Select LGA" : "Select State First"} />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All LGAs</SelectItem>
                                        {lgas.map(l => (
                                            <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-3 pt-4 border-t border-border/40">
                            <Button variant="outline" onClick={onClearFilters} className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Clear Filters
                            </Button>
                            <Button onClick={onSearch} disabled={loading} className="gap-2 font-bold px-8">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default AdmissionSearchFilters;
