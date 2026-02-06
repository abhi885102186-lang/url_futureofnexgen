"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [allowRead, setAllowRead] = useState(true);
  const [allowDelete, setAllowDelete] = useState(false);
  
  const handleSaveChanges = () => {
    // In a real app, you'd save these settings to a backend.
    console.log({ allowRead, allowDelete });
    toast({
        title: "Settings Saved",
        description: "Your changes to access control have been saved.",
    })
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage application settings and access controls. Only admins can modify these.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Access Control</CardTitle>
          <CardDescription>
            Control who can perform certain actions within the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="read-access" className="text-base">Read Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow non-admin members to view all shared content.
              </p>
            </div>
            <Switch
              id="read-access"
              checked={allowRead}
              onCheckedChange={setAllowRead}
              aria-label="Toggle read access"
            />
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="delete-access" className="text-base">Delete Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow non-admin members to delete files and members. (High risk)
              </p>
            </div>
            <Switch
              id="delete-access"
              checked={allowDelete}
              onCheckedChange={setAllowDelete}
              aria-label="Toggle delete access"
            />
          </div>
          <Button className="w-full" onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
