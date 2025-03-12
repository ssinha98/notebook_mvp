"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fileManager } from "@/tools/fileManager";
import { useSourceStore } from "@/lib/store";

interface FileUploaderProps {
  onUploadSuccess?: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const auth = getAuth();
  const storage = getStorage();
  const [user] = useAuthState(auth);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const addFileNickname = useSourceStore((state) => state.addFileNickname);

  // Upload a file to Firebase Storage
  const uploadFile = async (file: File) => {
    if (!user) return alert("You must be logged in to upload files.");
    setUploading(true);

    try {
      const result = await fileManager.handleFile({
        file,
        userId: user.uid,
        nickname: file.name,
        type: fileManager.getFileType(file.name),
      });

      if (result.success && result.data?.success) {
        addFileNickname(file.name, file.name, result.data.data.download_link);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop Upload
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(uploadFile);
    },
  });

  // Fetch User Files
  useEffect(() => {
    if (!user) return;

    const fetchFiles = async () => {
      const userFolder = ref(storage, `users/${user.uid}`);
      const result = await listAll(userFolder);

      const fileData = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          url: await getDownloadURL(item),
        }))
      );
      setFiles(fileData);
    };

    fetchFiles();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Drag & Drop Upload */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center cursor-pointer"
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          Drag & drop files here, or click to select files
        </p>
      </div>

      {/* File Picker Button */}
      <div className="mt-4 text-center">
        <input
          type="file"
          className="hidden"
          id="file-input"
          onChange={(e) => e.target.files && uploadFile(e.target.files[0])}
        />
        <Button
          onClick={() => document.getElementById("file-input")?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Select File"}
        </Button>
      </div>

      {/* Uploaded Files Table */}
      {/* {files.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Your Uploaded Files</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Download Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, index) => (
                <TableRow key={index}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Download
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )} */}
    </div>
  );
};

export default FileUploader;
