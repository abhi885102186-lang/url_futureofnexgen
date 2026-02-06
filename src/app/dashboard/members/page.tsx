"use client";

import { useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const memberSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  mobileNumber: z.string().min(10, "Invalid mobile number"),
  email: z.string().email("Invalid email address"),
});

type Member = z.infer<typeof memberSchema>;

export default function MembersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const membersCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "member_details");
  }, [firestore]);

  const { data: members, isLoading } = useCollection<Member>(membersCollectionRef);

  const form = useForm<Member>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", mobileNumber: "", email: "" },
  });

  function onSubmit(values: Member) {
    if (!membersCollectionRef) return;
    addDocumentNonBlocking(membersCollectionRef, { ...values, joinDate: new Date().toISOString() });
    form.reset();
    toast({
      title: "Member Added",
      description: `${values.name} has been successfully added.`,
    });
  }

  function deleteMember(id: string) {
    if (!firestore) return;
    const memberDocRef = doc(firestore, "member_details", id);
    deleteDocumentNonBlocking(memberDocRef);
    toast({
      variant: "destructive",
      title: "Member Removed",
      description: `The member has been removed.`,
    });
  }

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Member Management
        </h1>
        <p className="text-muted-foreground">
          Add, view, and manage team members.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Member List</CardTitle>
              <CardDescription>A list of all members in your team.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {!isLoading && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members && members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.mobileNumber}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteMember(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
               {!isLoading && members?.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No members found.
                </div>
               )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Add New Member</CardTitle>
              <CardDescription>
                Fill out the form to add a new member.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="mobileNumber"
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
                          <Input placeholder="john.d@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
