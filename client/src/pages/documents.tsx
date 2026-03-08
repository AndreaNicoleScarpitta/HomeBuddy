import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { getHome, getDocuments, createDocument, deleteDocument } from "@/lib/api";
import {
  FolderOpen,
  Upload,
  Loader2,
  Trash2,
  FileText,
  FileImage,
  File,
  Download,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { trackEvent } from "@/lib/analytics";
import { FieldTooltip } from "@/components/field-tooltip";
import type { HomeDocument } from "@shared/schema";

const documentCategories = [
  "General",
  "Insurance",
  "Warranty",
  "Permit",
  "Contract",
  "Receipt",
  "Other",
] as const;

function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    general: "bg-gray-100 text-gray-700 border-gray-200",
    insurance: "bg-blue-100 text-blue-700 border-blue-200",
    warranty: "bg-green-100 text-green-700 border-green-200",
    permit: "bg-purple-100 text-purple-700 border-purple-200",
    contract: "bg-orange-100 text-orange-700 border-orange-200",
    receipt: "bg-yellow-100 text-yellow-700 border-yellow-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[(category || "general").toLowerCase()] || colors.general;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType === "application/pdf") return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: HomeDocument;
  onDelete: (id: number) => void;
}) {
  const Icon = getFileIcon(doc.fileType);

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors group"
      data-testid={`card-document-${doc.id}`}
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate" data-testid={`text-document-name-${doc.id}`}>
          {doc.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(doc.category)}`}
            data-testid={`badge-category-${doc.id}`}
          >
            {doc.category || "General"}
          </span>
          {doc.fileSize && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(doc.fileSize)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {doc.createdAt
              ? format(new Date(doc.createdAt), "MMM d, yyyy")
              : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {doc.objectPath && (
          <a
            href={doc.objectPath}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors md:opacity-50 md:group-hover:opacity-100"
            data-testid={`link-download-${doc.id}`}
          >
            <Download className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={() => onDelete(doc.id)}
          className="p-2 text-muted-foreground hover:text-red-600 transition-colors md:opacity-50 md:group-hover:opacity-100"
          data-testid={`button-delete-${doc.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Documents() {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("General");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: home, isLoading: homeLoading } = useQuery({
    queryKey: ["home"],
    queryFn: getHome,
  });

  const homeId = (home as any)?.legacyId ?? (home as any)?.id;

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["documents", homeId],
    queryFn: () => getDocuments(homeId),
    enabled: !!homeId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document deleted" });
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = async (result: any) => {
    if (!homeId || !result.successful?.[0]) return;

    const file = result.successful[0];
    try {
      const objectPath = file.objectPath || `/objects/uploads/${file.id}`;
      await createDocument(homeId, {
        name: file.name,
        fileType: file.type,
        fileSize: file.size || 0,
        objectPath,
        category: uploadCategory.toLowerCase(),
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      trackEvent("upload", "documents", "document_uploaded");
      toast({
        title: "Document uploaded",
        description: `${file.name} has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save document metadata",
        variant: "destructive",
      });
    }
  };

  const getUploadParameters = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
      headers: { "Content-Type": file.type || "application/octet-stream" },
      objectPath: data.objectPath as string,
    };
  };

  if (homeLoading || docsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!home) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Please set up your home profile first.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1
              className="text-3xl font-heading font-bold text-foreground"
              data-testid="text-heading"
            >
              Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Store and organize your important home files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FieldTooltip termSlug="doc-insurance" screenName="documents" />
            <Select
              value={uploadCategory}
              onValueChange={setUploadCategory}
            >
              <SelectTrigger
                className="w-[130px]"
                data-testid="select-category"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} data-testid={`option-category-${cat.toLowerCase()}`}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={20971520}
              onGetUploadParameters={getUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="shadow-lg shadow-primary/20"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </ObjectUploader>
          </div>
        </header>

        {documents.length === 0 ? (
          <div className="py-16 text-center" data-testid="empty-state">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              No documents yet
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              Upload insurance policies, warranties, permits, contracts, and
              other important home documents to keep them organized in one
              place.
            </p>
            <p className="text-sm text-muted-foreground mt-4 max-w-sm mx-auto">
              Accepts PDF, images, Word, Excel, and text files up to 20MB
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="document-list">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                onDelete={(id) => setDeleteConfirmId(id)}
              />
            ))}
          </div>
        )}

        <AlertDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the document record. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteConfirmId) {
                    trackEvent("click", "documents", "delete_document");
                    deleteMutation.mutate(deleteConfirmId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
