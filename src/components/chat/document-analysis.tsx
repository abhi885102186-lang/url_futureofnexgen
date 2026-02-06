
"use client";

import { useState, useRef } from "react";
import { Paperclip, Loader2, UploadCloud, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as mammoth from 'mammoth';
import { useChat } from "./chat-view";

type DocumentAnalysisProps = {
  setDocumentPreview: (document: { name: string; dataUri: string, textContent: string } | null) => void;
};

const mimeTypeMap: { [key: string]: string } = {
  'txt': 'text/plain',
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const getMimeType = (fileName: string): string | undefined => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? mimeTypeMap[extension] : undefined;
}


export default function DocumentAnalysis({ setDocumentPreview }: DocumentAnalysisProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{name: string, dataUri: string, textContent: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const mimeType = getMimeType(selectedFile.name);
      if (!mimeType) {
        toast({
          variant: "destructive",
          title: "Unsupported File Type",
          description: "Please upload a .txt, .pdf, or .docx file.",
        });
        return;
      }
      setFile(selectedFile);
      setIsLoading(true);

      try {
        const reader = new FileReader();
        reader.readAsArrayBuffer(selectedFile);
        reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
                toast({ variant: "destructive", title: "File Read Error" });
                setIsLoading(false);
                return;
            }
            
            let textContent = '';
            if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ arrayBuffer });
                textContent = result.value;
            } else if (selectedFile.type === 'text/plain') {
                textContent = new TextDecoder().decode(arrayBuffer);
            } else if (selectedFile.type === 'application/pdf') {
                // For PDF, we can't extract text easily on the client-side without a heavy library.
                // We will send the data URI and let the backend handle it.
                // The AI flow is set up to receive a data URI.
            }

            const dataUriReader = new FileReader();
            dataUriReader.readAsDataURL(selectedFile);
            dataUriReader.onload = (dataUriEvent) => {
                const dataUri = dataUriEvent.target?.result as string;
                setFileData({ name: selectedFile.name, dataUri, textContent });
                setIsLoading(false);
            }
        };

      } catch (error) {
          console.error("Error processing file:", error);
          toast({ variant: "destructive", title: "File Processing Error" });
          setIsLoading(false);
      }
    }
  };

  const handleAttachFile = () => {
    if (file && fileData) {
      // The `dataUri` is what we use for the preview.
      // The `textContent` will be used in the chat-view's handleSubmit.
      setDocumentPreview(fileData);
      setIsOpen(false);
    }
  };
  
  const resetState = () => {
    setFile(null);
    setFileData(null);
    setIsLoading(false);
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
        <Button variant="ghost" size="icon">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Document Analysis</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
         <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        >
            <source src="/document-background.mp4" type="video/mp4" />
            Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/50 -z-10" />

        <div className="relative z-10 flex flex-col h-full text-white">
            <DialogHeader className="p-6">
            <DialogTitle className="font-headline text-white">Attach a Document</DialogTitle>
            <DialogDescription className="text-gray-300">
                Upload a TXT, PDF, or DOCX file to ask a question about it.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 px-6">
            {!file && (
                <div
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer bg-black/20 hover:bg-black/30"
                onClick={() => fileInputRef.current?.click()}
                >
                <UploadCloud className="w-10 h-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">TXT, PDF, or DOCX</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                />
                </div>
            )}

            {file && (
                <div className="space-y-4">
                <div className="relative group w-full rounded-lg border border-gray-600 bg-black/20 p-4 flex items-center justify-between">
                    { isLoading ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                            <p className="font-medium">Processing {file.name}...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-primary"/>
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <Button variant="destructive" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={resetState}>
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
                </div>
            )}
            </div>
            <DialogFooter className="p-6 pt-0 bg-transparent">
            <Button onClick={handleAttachFile} disabled={!file || !fileData || isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Attach Document'}
            </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
