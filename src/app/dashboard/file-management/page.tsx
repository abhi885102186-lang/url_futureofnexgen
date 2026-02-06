
"use client";

import { useState, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Trash2, Download, FileText, ExternalLink, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type UploadedFile = {
  id?: string;
  fileName: string;
  contentType: "PDF" | "CSV";
  size: string;
  uploadTimestamp: string;
  contentUrl?: string; // For data URLs or future storage URLs
  content?: string[][]; // For CSV data
};

export default function FileManagementPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const filesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "admin_content");
  }, [firestore]);

  const { data: files, isLoading } = useCollection<UploadedFile>(filesCollectionRef);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fileType: "PDF" | "CSV") => {
    const file = event.target.files?.[0];
    if (file && filesCollectionRef) {
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const determinedType = isCsv ? 'CSV' : fileType;

      const newFileBase = {
        fileName: file.name,
        contentType: determinedType,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        uploadTimestamp: new Date().toISOString(),
      };

      if (determinedType === 'CSV') {
        Papa.parse(file, {
          complete: (results) => {
            const fileData: Partial<UploadedFile> = {
              ...newFileBase,
              content: results.data as string[][],
            };
            addDocumentNonBlocking(filesCollectionRef, fileData);
            toast({
              title: "File Uploaded",
              description: `${file.name} has been successfully uploaded.`,
            });
          },
          error: (error: any) => {
            toast({
              variant: "destructive",
              title: "Parsing Error",
              description: `Could not parse the file: ${error.message}`,
            });
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileData: Partial<UploadedFile> = {
            ...newFileBase,
            contentUrl: e.target?.result as string,
          };
          addDocumentNonBlocking(filesCollectionRef, fileData);
          toast({
            title: "File Uploaded",
            description: `${file.name} has been successfully uploaded.`,
          });
        };
        reader.onerror = () => {
          toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
          });
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset the input value to allow uploading the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const fileDocRef = doc(firestore, "admin_content", id);
    deleteDocumentNonBlocking(fileDocRef);
    toast({
      variant: "destructive",
      title: "File Deleted",
      description: `The file has been removed.`,
    });
  };

  const handleDownload = (file: UploadedFile) => {
    if (file.contentUrl) {
      const link = document.createElement("a");
      link.href = file.contentUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.content) {
      const csv = Papa.unparse(file.content);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute('download', file.fileName.endsWith('.csv') ? file.fileName : `${file.fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        variant: "destructive",
        title: "Download Not Available",
        description: "This file cannot be downloaded as its content is not available.",
      });
    }
  };

  const handleFileClick = (file: UploadedFile) => {
    if (file.content) {
      setPreviewFile(file);
    } else if (file.contentUrl) {
      if (file.contentType === 'PDF') {
        window.open(file.contentUrl, '_blank');
      } else {
        handleDownload(file);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Action Not Available",
        description: "This file cannot be opened or previewed.",
      });
    }
  };

  return (
    <div className="container mx-auto space-y-8">
      <input
        type="file"
        ref={pdfInputRef}
        className="hidden"
        accept="application/pdf"
        onChange={(e) => handleFileSelect(e, "PDF")}
      />
      <input
        type="file"
        ref={csvInputRef}
        className="hidden"
        accept=".csv"
        onChange={(e) => handleFileSelect(e, "CSV")}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          File Management
        </h1>
        <p className="text-muted-foreground">
          Upload and manage shared PDF and CSV files.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <FileText className="h-5 w-5" /> Upload PDF
            </CardTitle>
            <CardDescription>
              Upload PDF documents to share with your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => pdfInputRef.current?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Select PDF File
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Upload CSV
            </CardTitle>
            <CardDescription>
              Upload CSV spreadsheets for data analysis and sharing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => csvInputRef.current?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Select CSV File
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Uploaded Files</CardTitle>
          <CardDescription>View and manage recently uploaded files.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && (
                 <div className="flex items-center justify-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
            {!isLoading && (
              <div className="space-y-4">
                {files && files.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No files uploaded yet.</div>
                ) : files?.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                    <div className="flex items-center gap-4">
                      {file.contentType === 'PDF' ? <FileText className="h-6 w-6 text-destructive" /> : <FileSpreadsheet className="h-6 w-6 text-green-500" />}
                      <div>
                        {file.contentType === 'PDF' && file.contentUrl ? (
                          <Link href={file.contentUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1.5">
                            {file.fileName}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <button onClick={() => handleFileClick(file)} className="font-semibold hover:underline text-left">
                            {file.fileName}
                          </button>
                        )}
                        <p className="text-sm text-muted-foreground">{file.contentType} &middot; {file.size} &middot; {format(new Date(file.uploadTimestamp), "yyyy-MM-dd")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.content && (
                        <Button variant="ghost" size="icon" onClick={() => setPreviewFile(file)} title={`Preview ${file.fileName}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Preview {file.fileName}</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(file)} title={`Download ${file.fileName}`}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download ${file.fileName}</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(file.id!)} title={`Delete ${file.fileName}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete ${file.fileName}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewFile.fileName}</DialogTitle>
              <DialogDescription>
                Preview of the spreadsheet data.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewFile.content?.[0].map((header, i) => <TableHead key={i}>{header}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewFile.content?.slice(1).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
