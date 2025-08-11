import { useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  VStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";

interface ObjectUploaderProps {
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  onComplete?: (fileUrl: string) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and handles file uploads
 * directly to object storage using presigned URLs.
 */
export function ObjectUploader({
  maxFileSize = 5242880, // 5MB default
  acceptedFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  onComplete,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setUploadProgress(0);

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError(`File type not supported. Please use: ${acceptedFileTypes.join(", ")}`);
      return;
    }

    try {
      setIsUploading(true);

      // Get upload URL from server
      const response = await fetch("/api/logo/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await response.json();

      // Upload file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setUploadProgress(100);
      
      // Extract the public URL from the upload URL
      const publicUrl = uploadURL.split("?")[0]; // Remove query parameters
      
      toast({
        title: "Upload successful",
        description: "Your logo has been uploaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onComplete?.(publicUrl);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Upload failed");
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset the file input
      event.target.value = "";
    }
  };

  return (
    <VStack spacing={3} align="stretch">
      <input
        type="file"
        accept={acceptedFileTypes.join(",")}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        id="file-upload"
      />
      
      <Button
        as="label"
        htmlFor="file-upload"
        isLoading={isUploading}
        loadingText="Uploading..."
        cursor="pointer"
        disabled={isUploading}
      >
        {children}
      </Button>

      {isUploading && (
        <VStack spacing={2}>
          <Progress value={uploadProgress} width="100%" colorScheme="blue" />
          <Text fontSize="sm" color="gray.500">
            Uploading... {uploadProgress}%
          </Text>
        </VStack>
      )}

      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <AlertTitle fontSize="sm">Upload Error</AlertTitle>
            <AlertDescription fontSize="sm">{error}</AlertDescription>
          </VStack>
        </Alert>
      )}
    </VStack>
  );
}