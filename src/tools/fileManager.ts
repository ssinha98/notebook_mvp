import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { api } from "./api";
import {
  getFirestore,
  setDoc,
  doc,
  collection,
  getDocs,
} from "firebase/firestore";

interface FileDocument {
  full_name: string;
  download_link: string;
  nickname: string;
  file_type: string;
  created_at: string;
  userId: string;
}

export const fileManager = {
  // Upload file to Firebase Storage
  uploadToStorage: async (file: File, userId: string) => {
    const storage = getStorage();
    const fileRef = ref(storage, `users/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  },

  // Create file document in Firestore
  createFileDocument: async (
    fileDoc: Omit<FileDocument, "created_at">,
    userId: string
  ) => {
    const db = getFirestore();
    const document: FileDocument = {
      ...fileDoc,
      userId,
      created_at: new Date().toISOString(),
    };

    // Create in users/{userId}/files/{nickname}
    await setDoc(
      doc(db, "users", userId, "files", document.nickname),
      document
    );
    return { success: true, data: document };
  },

  // Add method to fetch user's files
  getUserFiles: async (userId: string) => {
    const db = getFirestore();
    const filesSnapshot = await getDocs(
      collection(db, "users", userId, "files")
    );
    return filesSnapshot.docs.map((doc) => doc.data() as FileDocument);
  },

  // Combined function to handle both upload and document creation
  handleFile: async ({
    file,
    userId,
    nickname,
    type,
    url = "",
  }: {
    file?: File;
    userId: string;
    nickname: string;
    type: "image" | "csv" | "pdf" | "website";
    url?: string;
  }) => {
    try {
      let downloadLink = url;

      // Handle file upload for non-website sources
      if (file && type !== "website") {
        downloadLink = await fileManager.uploadToStorage(file, userId);
      }

      // Create and save file document
      const fileDoc = {
        full_name: file?.name || url || "",
        download_link: downloadLink,
        nickname,
        file_type: type === "website" ? "website" : `.${type}`,
        userId,
      };

      const result = await fileManager.createFileDocument(fileDoc, userId);
      return { success: true, data: result };
    } catch (error) {
      console.error("Error handling file:", error);
      return { success: false, error };
    }
  },

  // Add this helper function
  getFileType: (filename: string): "image" | "csv" | "pdf" | "website" => {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
      case "csv":
        return "csv";
      case "pdf":
        return "pdf";
      case "jpg":
      case "jpeg":
      case "png":
        return "image";
      default:
        return "pdf"; // Default case, you might want to handle this differently
    }
  },
};
