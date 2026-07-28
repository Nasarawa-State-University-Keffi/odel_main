export const endpoint = {
    auth: {
        signin: '/auth/login',
        logout: '/auth/logout',
        me: '/auth/me',
    },

    courses: {
        list: "/courses/",
    },

    sync: {
        all: "/synchronize/sync-all"
    },

    student: {
        dashboard: {
            student: '/dashboard/students/?semester_id=19&session_id=17',
        },
        courses: {
            list: '/courses/courses/',
        }
    },

    staff: {
        dashboard: {
            staff: '/dashboard/instructors',
            accessment: {
                assignment: "/staff/assessment/assignments/",
                submissions: "/staff/assessment/submissions/"
            }
        }
    },

    semester: '/semesters/',
    session: '/sessions/',

    programme_type: "/program-type/",

    admin: {
        storage: {
            content: {
                base: "/content/storage-settings/"
            }
        }
    }

}