import { Plus } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import odelLogo from '@/assets/odel-logo.jpg';

const PROGRAMS = [
    {
        id: "bachelors",
        name: "Bachelor's Program",
        faculties: [
            {
                name: "Faculty of Natural & Applied Sciences",
                departments: [
                    "Computer Science",
                    "Mathematics",
                    "Microbiology",
                    "Biochemistry",
                    "Physics",
                    "Statistics"
                ]
            },
            {
                name: "Faculty of Social Sciences",
                departments: [
                    "Economics",
                    "Political Science",
                    "Sociology",
                    "Psychology",
                    "Mass Communication",
                    "Geography"
                ]
            },
            {
                name: "Faculty of Arts",
                departments: [
                    "English",
                    "History",
                    "Theatre Arts",
                    "French",
                    "Arabic Studies",
                    "Philosophy"
                ]
            },
            {
                name: "Faculty of Administration",
                departments: [
                    "Accounting",
                    "Business Administration",
                    "Public Administration",
                    "Banking and Finance",
                    "Entrepreneurship"
                ]
            },
            {
                name: "Faculty of Education",
                departments: [
                    "Educational Management",
                    "Guidance and Counseling",
                    "Science Education",
                    "Arts Education"
                ]
            }
        ]
    },
    {
        id: "masters",
        name: "Master's Program",
        faculties: [
            {
                name: "Faculty of Natural & Applied Sciences",
                departments: [
                    "M.Sc. Computer Science",
                    "M.Sc. Mathematics",
                    "M.Sc. Microbiology",
                    "M.Sc. Biochemistry",
                    "M.Sc. Physics"
                ]
            },
            {
                name: "Faculty of Social Sciences",
                departments: [
                    "M.Sc. Economics",
                    "M.Sc. Political Science",
                    "M.Sc. Sociology",
                    "M.Sc. Psychology"
                ]
            },
            {
                name: "Faculty of Administration",
                departments: [
                    "MBA (Business Administration)",
                    "M.Sc. Accounting",
                    "M.Sc. Banking and Finance"
                ]
            },
            {
                name: "Faculty of Education",
                departments: [
                    "M.Ed. Educational Management",
                    "M.Ed. Guidance and Counseling",
                    "M.Ed. Curriculum Studies"
                ]
            }
        ]
    }
];

const CourseList = () => {
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
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {PROGRAMS.map((program, programIdx) => (
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
                                        {program.faculties.map((faculty, idx) => (
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
                                                    {faculty.departments.map((dept, deptIdx) => (
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
                                        ))}
                                    </motion.div>
                                </AccordionContent>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </Accordion>
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
