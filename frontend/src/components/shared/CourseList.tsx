import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { programmeService, Programme } from "@/services/programmeService";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import odelLogo from '@/assets/odel-logo.jpg';



const CourseList = () => {
    const [programsList, setProgramsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    console.log('program list', programsList)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const types = await programmeService.getAllProgrammeTypes();
                const formattedData = await Promise.all(types.map(async (type) => {
                    let apiPrograms: Programme[] = [];
                    try {
                        apiPrograms = await programmeService.getProgrammesByType(type.id);
                    } catch (err) {
                        console.error(`Failed to fetch programmes for type ${type.id}`, err);
                    }

                    // Group by faculty
                    const facultyMap = new Map<string, Set<string>>();

                    apiPrograms.forEach(p => {
                        const facultyName = p.department?.faculty?.name || p.school?.name || 'Other';
                        const deptName = p.name;

                        if (!facultyMap.has(facultyName)) {
                            facultyMap.set(facultyName, new Set());
                        }
                        facultyMap.get(facultyName)?.add(deptName);
                    });

                    const faculties = Array.from(facultyMap.entries()).map(([name, depts]) => ({
                        name,
                        departments: Array.from(depts).sort()
                    })).sort((a, b) => a.name.localeCompare(b.name));

                    return {
                        id: type.id.toString(),
                        name: type.name,
                        faculties
                    };
                }));

                // Sort by ID or name if needed, assuming API order is fine or sorting by type ID
                setProgramsList(formattedData);
            } catch (error) {
                console.error("Failed to fetch programme types", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full">
            <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <img
                    src={odelLogo}
                    alt="odel Logo"
                    width={200}
                    height={200}
                    className="mb-6"
                />
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Our Programme List.
                </h1>
            </motion.div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading programmes...</div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {programsList.map((program, programIdx) => (
                            <motion.div
                                key={program.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: programIdx * 0.1,
                                    ease: "easeOut"
                                }}
                            >
                                <AccordionItem
                                    value={program.id}
                                    className="border-0 bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                                >
                                    <AccordionTrigger hideIcon className="group hover:no-underline px-6 py-4 text-base font-normal text-foreground hover:bg-gray-50 transition-all duration-300 [&[data-state=open]>span>svg]:rotate-45">
                                        <span className="flex items-center justify-between w-full">
                                            <span className="transition-all duration-300 group-hover:translate-x-1">
                                                {program.name}
                                            </span>
                                            <Plus className="h-5 w-5 shrink-0 transition-all duration-300 ease-out group-hover:scale-110" />
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-4 pt-2">
                                        <motion.div
                                            className="space-y-4"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3, delay: 0.1 }}
                                        >
                                            {program.faculties.length > 0 ? (
                                                program.faculties.map((faculty: any, idx: number) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="space-y-2"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{
                                                            duration: 0.3,
                                                            delay: idx * 0.05,
                                                            ease: "easeOut"
                                                        }}
                                                    >
                                                        <h3 className="font-semibold text-sm text-primary">
                                                            {faculty.name}
                                                        </h3>
                                                        <ul className="space-y-1 pl-4">
                                                            {faculty.departments.map((dept: string, deptIdx: number) => (
                                                                <motion.li
                                                                    key={deptIdx}
                                                                    className="text-sm text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer py-1 hover:translate-x-1"
                                                                    initial={{ opacity: 0, x: -5 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{
                                                                        duration: 0.2,
                                                                        delay: (idx * 0.05) + (deptIdx * 0.02),
                                                                        ease: "easeOut"
                                                                    }}
                                                                    whileHover={{
                                                                        scale: 1.02,
                                                                        transition: { duration: 0.2 }
                                                                    }}
                                                                >
                                                                    • {dept}
                                                                </motion.li>
                                                            ))}
                                                        </ul>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="text-sm text-muted-foreground">No programmes found.</div>
                                            )}
                                        </motion.div>
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
                )}
            </div>

            <motion.div
                className="mt-8 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <p>© {new Date().getFullYear()} Nasarawa State University, Keffi. All rights reserved.</p>
            </motion.div>
        </div>
    );
};

export default CourseList;
