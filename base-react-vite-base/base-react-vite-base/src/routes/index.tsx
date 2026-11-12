import { createFileRoute, redirect } from '@tanstack/react-router';
import { useUserStore } from '@/stores/userStore';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { token, user } = useUserStore.getState();
    throw redirect({
      to: token && user ? '/dashboard' : '/login',
      replace: true,
    });
  },
});
