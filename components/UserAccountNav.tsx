import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "@/lib/offline-auth";
import { useRouter } from "next/router";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";

export function UserAccountNav() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get user from localStorage on client-side
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);
  
  if (!user) return null;
  
  // Get initials for avatar
  const initials = user.name
    ? user.name
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
    : user.email.substring(0, 2).toUpperCase();

  // Function to display role in a more readable format
  const formatRole = (role: string) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.role && formatRole(user.role)}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            className="flex w-full cursor-pointer items-center"
            onClick={() => {
              logoutUser();
              router.push('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
