import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentUser, signOut } from '../../../lib/supabase';

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };
};

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error) {
          console.error('Kullanıcı bilgisi alınırken hata oluştu:', error.message);
          return;
        }
        setUser(user as User);
      } catch (err) {
        console.error('Beklenmeyen bir hata oluştu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Çıkış yapılırken hata oluştu:', error.message);
        return;
      }
      setUser(null);
    } catch (err) {
      console.error('Beklenmeyen bir hata oluştu:', err);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-8 w-8 rounded-full bg-gray-200"></div>;
  }

  if (!user) {
    return null;
  }

  const userInitials = user.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Kullanıcı';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
