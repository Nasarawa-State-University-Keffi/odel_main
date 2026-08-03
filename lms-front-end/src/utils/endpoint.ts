export const endpoint = {

    auth: {
        signin: '/auth/login',
        logout: '/auth/logout',
        me: '/auth/me',
    },

    courses: {
        list: "/courses/",
    },

    content: {
        base: "/content/"
    },

    sync: {
        all: "/synchronize/sync-all"
    },

    student: {
        dashboard: {
            student: '/dashboard/students/?session=2024%2F2025&semester=First',
            // /dashboard/students/?semester_id=19&session_id=17
            assessment: {
                assignment: {
                    base: "/student/assessment/assignments/",
                    submissions: {
                        base: "/student/assessment/submissions/",
                        create: "/student/assessment/submissions/create/"

                    }
                },

                quiz: {
                    quizzes: "/student/assessment/quizzes/",
                    submissions: "/student/assessment/quiz-submissions/",
                    questions: "/student/assessment/quizzes/questions/"
                },
            },
        },
        courses: {
            list: '/courses/courses/',
        },

    },

    staff: {
        dashboard: {
            staff: '/dashboard/instructors',
            assessment: {
                assignment: {
                    assignment: "/staff/assessment/assignments/",
                    submissions: "/staff/assessment/submissions/",

                    submission: {
                        base: "/staff/assessment/submissions/"
                    }
                },



                quiz: {
                    quizzes: "/staff/assessment/quizzes/",
                    submissions: "/staff/assessment/quiz-submissions/",
                    questions: "/staff/assessment/quizzes/questions/"
                },

                question_bank: {
                    categories: {
                        base: "/staff/assessment/question-bank/categories/"
                    },
                    questions: {
                        base: "/staff/assessment/question-bank/questions/"
                    }
                }
            },

            content: {
                upload: {
                    file: "/content/upload/",
                    youtube: "/content/add-youtube/"
                }
            }

        },

    },

    semester: '/semesters/',
    session: '/sessions/',

    programme_type: "/program-type/",

    admin: {
        storage: {
            content: {
                storage_setting: {
                    base: "/content/storage-settings/"
                }
            }
        }
    }

}

