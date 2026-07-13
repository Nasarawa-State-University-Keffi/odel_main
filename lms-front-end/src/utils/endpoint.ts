export const endpoint = {
    auth: {
        signin: '/auth/login',
        logout: '/auth/logout',
        me: '/auth/me',
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

    semester: '/semesters/',
    session: '/sessions/'

}