
"use client";

import Link from "next/link";
import {
  User,
  History,
  LogOut,
  Settings,
  FolderKanban,
  Users,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "../theme-toggle";
import { useRouter } from "next/navigation";
import { Logo } from "../logo";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";


export default function Header({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/login");
    } catch (error) {
       toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while logging out." });
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background text-foreground px-4 md:px-6">
      <div className="flex items-center gap-4">
        {children}
        <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-headline text-lg font-semibold">Nexus Assistant</span>
        </Link>
      </div>

      <div className="hidden md:block">
        <span className="font-headline text-xl font-bold tracking-widest rainbow-text">
          FUTURE OF NEX GEN
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL || undefined} alt="@shadcn" />
                    <AvatarFallback>
                        {user?.displayName ? user.displayName.charAt(0) : <User className="h-5 w-5" />}
                    </AvatarFallback>
                </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href="/dashboard/history">History</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/file-management">File Management</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/members">Members</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-center p-2">
               <ThemeToggle />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
