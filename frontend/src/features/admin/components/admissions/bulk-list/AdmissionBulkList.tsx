import { useState, useEffect } from "react";
import { admissionService } from "@/features/admin/services/admissionService";
import { staffService, Faculty, Department, State, Gender, ProgrammeType, LGA, Level } from "@/features/admin/services/staffService";
import AdmissionSearchFilters from "./components/AdmissionSearchFilters";
import AdmissionResultsTable from "./components/AdmissionResultsTable";

const AdmissionBulkList = () => {
    // FILTERS
    const [filters, setFilters] = useState({
        level: "",
        admission: "",
        faculty: "",
        department: "",
        programme: "",
        country: "",
        state: "",
        lga: "",
        gender: ""
    });

    // METADATA
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [genders, setGenders] = useState<Gender[]>([]);
    const [programmes, setProgrammes] = useState<ProgrammeType[]>([]);
    const [lgas, setLgas] = useState<LGA[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    const [loadingLgas, setLoadingLgas] = useState(false);
    const [loadingLevels, setLoadingLevels] = useState(false);

    // DATA
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // SINGLE SEARCH
    const [applicantId, setApplicantId] = useState("");
    const [singleLoading, setSingleLoading] = useState(false);

    useEffect(() => {
        const fetchMeta = async () => {
            setLoadingMetadata(true);
            try {
                const [facData, deptData, countriesData, gendersData, programmesData, activeAdmission] = await Promise.all([
                    staffService.getAllFaculties(),
                    staffService.getAllDepartments(),
                    staffService.getCountries(),
                    staffService.getGenders(),
                    staffService.getAllProgrammeTypes(),
                    admissionService.getActiveAdmission()
                ]);
                setFaculties(facData);
                setDepartments(deptData);
                setGenders(gendersData);
                setProgrammes(programmesData);

                if (activeAdmission && activeAdmission.id) {
                    setFilters(prev => ({ ...prev, admission: activeAdmission.id.toString() }));
                }

                // Find Nigeria and set states using the code NG for nigeria
                const nigeria = countriesData.find(c => c.code === "NG");
                if (nigeria && nigeria.states) {
                    setStates(nigeria.states);
                }
            } catch (error) {
                console.error("Failed to load metadata", error);
            } finally {
                setLoadingMetadata(false);
            }
        };
        fetchMeta();
    }, []);

    useEffect(() => {
        const fetchLgas = async () => {
            if (!filters.state) {
                setLgas([]);
                return;
            }
            setLoadingLgas(true);
            try {
                const lgaData = await staffService.getLgasByState(Number(filters.state));
                setLgas(lgaData);
            } catch (error) {
                console.error("Failed to load LGAs", error);
                setLgas([]);
            } finally {
                setLoadingLgas(false);
            }
        };
        fetchLgas();
    }, [filters.state]);

    useEffect(() => {
        const fetchLevels = async () => {
            if (!filters.programme || filters.programme === 'all') {
                setLevels([]);
                return;
            }
            setLoadingLevels(true);
            try {
                // Determine if programme is an ID string or number
                const progId = Number(filters.programme);
                if (!isNaN(progId)) {
                    const levelData = await staffService.getLevelsByProgrammeType(progId);
                    setLevels(levelData);
                }
            } catch (error) {
                console.error("Failed to load levels", error);
                setLevels([]);
            } finally {
                setLoadingLevels(false);
            }
        };
        fetchLevels();
    }, [filters.programme]);

    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);
        try {
            const params: any = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = Number(value);
            });

            const data = await admissionService.getAdmissionBulk(params);
            if (Array.isArray(data)) {
                setStudents(data);
            } else if (data && Array.isArray(data.content)) {
                setStudents(data.content);
            } else if (data && Array.isArray(data.data)) {
                setStudents(data.data);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error("Failed to fetch bulk admission list", error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSingleSearch = async () => {
        if (!applicantId) return;
        setSingleLoading(true);
        setHasSearched(true);
        try {
            const data = await admissionService.getAdmissionSingle(applicantId);
            if (data) {
                setStudents([data]);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error("Failed to find applicant", error);
            setStudents([]);
        } finally {
            setSingleLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
    };

    const clearFilters = () => {
        setFilters({
            level: "",
            admission: "",
            faculty: "",
            department: "",
            programme: "",
            country: "",
            state: "",
            lga: "",
            gender: ""
        });
        setStudents([]);
        setHasSearched(false);
        setLgas([]);
        setLevels([]);
    };

    return (
        <div className="space-y-6">
            <AdmissionSearchFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                onSearch={handleSearch}
                loading={loading}
                applicantId={applicantId}
                onApplicantIdChange={setApplicantId}
                onSingleSearch={handleSingleSearch}
                singleLoading={singleLoading}
                faculties={faculties}
                departments={departments}
                states={states}
                genders={genders}
                programmes={programmes}
                lgas={lgas}
                levels={levels}
                loadingMetadata={loadingMetadata}
                loadingLgas={loadingLgas}
                loadingLevels={loadingLevels}
            />

            <AdmissionResultsTable
                students={students}
                loading={loading}
                hasSearched={hasSearched}
            />
        </div>
    );
};

export default AdmissionBulkList;
