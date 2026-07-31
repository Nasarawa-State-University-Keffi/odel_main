import { useState, useTransition } from "react";
import BaseRepository from "@/repository/base.repository";
import { endpoint } from "@/utils/endpoint";
import type { PaginatedCourses } from "@/types/course.types";
import type { Course } from "@/types/course.types";

export const useCourse = () => {
    const [isPending, startTransition] = useTransition();
    const [coursesData, setCoursesData] = useState<PaginatedCourses | null>(null);
    const [courseDetail, setCourseDetail] = useState<Course | null>(null);
    const [error, setError] = useState<unknown>(null)
    const repository = new BaseRepository();


    const fetchCourses = (params?: { url?: string, search?: string }) => {
        startTransition(async () => {
            try {
                let targetUrl = endpoint.student.courses.list;

                if (params?.url) {
                    targetUrl = params.url;
                } else if (params?.search) {
                    targetUrl = `${endpoint.student.courses.list}?search=${encodeURIComponent(params.search)}`;
                }

                const response = await repository.get(targetUrl);
                setCoursesData(response.data as PaginatedCourses);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
                setError(error)
            }
        });
    };

    const fetchCourseDetail = (courseId: string) => {
        startTransition(async () => {
            try {
                const response = await repository.get(`${endpoint.student.courses.list}${courseId}/`);
                setCourseDetail(response.data as Course);

            } catch (error) {
                console.error("Failed to fetch course details:", error);
                setError(error)
            }
        });
    };

    const fetchCourseList = () => {
        startTransition(async () => {
            try {
                const response = await repository.get(endpoint.courses.list);
                setCoursesData(response.data as PaginatedCourses);
            } catch (error) {
                console.error("Failed to fetch course list:", error);
                setError(error)
            }
        });
    };

    return {
        fetchCourses,
        isPending,
        coursesData,
        fetchCourseDetail,
        courseDetail,
        fetchCourseList,
        error
    };
};