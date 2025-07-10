"use client";

import { useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentUploadCardProps {
    title: string;
    description: string;
    documentUrl?: string;
    onUpload: (file: File) => Promise<void>;
    uploading?: boolean;
}

export function DocumentUploadCard({
    title,
    description,
    documentUrl,
    onUpload,
    uploading = false
}: DocumentUploadCardProps) {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            await onUpload(selectedFile);
        }
    };

    const handleRemove = () => {
        setFile(null);
    };

    return (
        <div className="border rounded-lg p-4">
            <div className="flex flex-col h-full">
                <h4 className="font-medium">{title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{description}</p>

                {documentUrl ? (
                    <div className="mt-auto">
                        <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <FileText className="h-4 w-4" />
                            View uploaded document
                        </a>
                    </div>
                ) : (
                    <div className="mt-auto">
                        <Label htmlFor={`upload-${title}`} className="cursor-pointer w-full">
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-accent transition-colors">
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="text-sm">Uploading...</span>
                                    </div>
                                ) : file ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm truncate">{file.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove();
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <UploadCloud className="h-6 w-6" />
                                        <span className="text-sm">Click to upload</span>
                                    </div>
                                )}
                            </div>
                            <Input
                                id={`upload-${title}`}
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </Label>
                    </div>
                )}
            </div>
        </div>
    );
}