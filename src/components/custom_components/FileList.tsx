"use client";

import { useEffect, useState } from "react";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { auth } from "@/tools/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useSourceStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";

interface FileItem {
  name: string;
  url: string;
  nickname?: string;
  timestamp?: number;
}

interface FileListProps {
  refreshTrigger?: number;
}

const FileList: React.FC<FileListProps> = ({ refreshTrigger }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [user] = useAuthState(auth);
  const { addFileNickname, removeFileNickname } = useSourceStore();
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const fetchFiles = async () => {
      const db = getFirestore();

      try {
        const filesSnapshot = await getDocs(
          collection(db, "users", user.uid, "files")
        );
        const fileList = filesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.full_name,
            url: data.download_link,
            nickname: data.nickname,
            timestamp: new Date(data.created_at).getTime() || 0,
          };
        });

        // Sort files by timestamp in descending order (newest first)
        const sortedFiles = fileList.sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );
        console.log("Files from Firestore:", sortedFiles);
        setFiles(sortedFiles);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [user, refreshTrigger]);

  const handleDelete = async (fileName: string) => {
    if (!user) return;
    const storage = getStorage();
    const fileRef = ref(storage, `users/${user.uid}/${fileName}`);
    const db = getFirestore();
    const fileDocRef = doc(db, "users", user.uid, "files", fileName);

    try {
      console.log("Attempting to delete document:", fileDocRef.path);
      // Delete from Cloud Storage
      await deleteObject(fileRef);
      // Delete from Firestore
      await deleteDoc(fileDocRef);
      console.log("Document deleted successfully");
      // Update local state
      setFiles((prev) => prev.filter((file) => file.name !== fileName));
      // Remove from nickname store if it exists
      removeFileNickname(fileName);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Log more specific error information
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  };

  const handleSaveNickname = async (file: FileItem) => {
    if (!user || !nickname) return;

    try {
      const db = getFirestore();
      await updateDoc(doc(db, "users", user.uid, "files", file.name), {
        nickname: nickname,
      });

      // Update local state
      addFileNickname(nickname, file.name, file.url);
      setEditingNickname(null);
      setNickname("");

      // Update files state immediately
      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.name === file.name ? { ...f, nickname } : f))
      );
    } catch (error) {
      console.error("Error updating nickname:", error);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold text-white">Uploaded Files</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Nickname</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.name}>
              <TableCell>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {file.name}
                </a>
              </TableCell>
              <TableCell>
                {editingNickname === file.name ? (
                  <div className="flex gap-2">
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter nickname"
                      className="w-32 bg-zinc-800 text-white"
                    />
                    <Button onClick={() => handleSaveNickname(file)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingNickname(file.name);
                      setNickname(file.nickname || "");
                    }}
                  >
                    {file.nickname || "Add nickname"}
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(file.name)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FileList;
