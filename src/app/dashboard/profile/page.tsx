
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Upload, Loader2 } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  mobile: z.string().min(10, "Please enter a valid mobile number.").optional().or(z.literal('')),
  email: z.string().email("Please enter a valid email address."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.photoURL || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || "",
      mobile: "",
      email: user?.email || "",
    },
  });

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);


  useEffect(() => {
    if (userDocRef) {
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            name: user?.displayName || data.name || "",
            email: user?.email || data.email || "",
            mobile: data.mobileNumber || "",
          });
        }
      });
    }
  }, [userDocRef, user, form]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !userDocRef) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }

    setIsSaving(true);
    try {
      // We can't update photoURL with a data URI client-side without a backend upload service.
      // We will only update the display name for now.
      if (user.displayName !== data.name) {
        await updateProfile(user, {
          displayName: data.name,
        });
      }

      // Update user document in Firestore non-blockingly
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        name: data.name,
        email: data.email,
        mobileNumber: data.mobile || null,
        // We can't save the profile image URL without uploading it first
        // profileImageUrl: user.photoURL 
      }, { merge: true });

      toast({
        title: "Profile Updated",
        description: "Your profile details have been saved successfully.",
      });

    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and profile picture.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile Details</CardTitle>
          <CardDescription>
            Update your information below. The email address is used for login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || undefined} alt="User avatar" />
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleAvatarUpload}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.d@example.com"
                        {...field}
                        readOnly
                        className="cursor-not-allowed bg-muted"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground pt-1">Email cannot be changed.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
