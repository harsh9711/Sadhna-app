import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Index() {
  const { loading, session, profile, role } = useAuth();

  if (loading) return <LoadingSpinner message="Loading..." />;

  if (!session) return <Redirect href="/(auth)/login" />;

  if (!profile) return <LoadingSpinner message="Loading profile..." />;

  if (role === 'admin') return <Redirect href="/(admin)/dashboard" />;

  return <Redirect href="/(user)/today" />;
}
