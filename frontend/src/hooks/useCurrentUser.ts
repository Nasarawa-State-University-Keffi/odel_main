import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: authAPI.getCurrentUser,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        enabled: !!Cookies.get('admin_token'), // Only fetch if token exists
    });
};
