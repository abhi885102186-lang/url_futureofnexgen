"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useChat } from "./chat-view";

type ImageAnalysisProps = {
  setImagePreview: (image: string | null) => void;
};

export default function ImageAnalysis({ setImagePreview }: ImageAnalysisProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Gemini
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 4MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachImage = () => {
    if (localImagePreview) {
      setImagePreview(localImagePreview);
      setIsOpen(false);
    }
  };

  const resetState = () => {
    setLocalImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" className="bg-white hover:bg-muted">
          <ImageIcon className="h-5 w-5 text-black" />
          <span className="sr-only">Image Analysis</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Attach an Image</DialogTitle>
          <DialogDescription>
            Upload an image to ask a question about it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!localImagePreview && (
            <div
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-10 h-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 4MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {localImagePreview && (
            <div className="space-y-4">
              <div className="relative group w-full max-h-96 overflow-hidden rounded-lg">
                <Image
                  src={localImagePreview}
                  alt="Image preview"
                  width={400}
                  height={300}
                  className="object-contain w-full h-full"
                />
                 <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={resetState}>
                    <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAttachImage} disabled={!localImagePreview} className="w-full">
            Attach Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
