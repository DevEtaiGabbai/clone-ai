import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export function SignOutButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '',
  showIcon = true
}: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className} 
      onClick={handleSignOut}
    >
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      Sign out
    </Button>
  );
} 