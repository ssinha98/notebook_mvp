import { useState } from "react";
import FileUploader from "@/components/custom_components/FileUploader";
import Layout from "@/components/Layout";
import FileList from "@/components/custom_components/FileList";

export default function Files() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-white">Files</h1>
        <FileUploader onUploadSuccess={handleUploadSuccess} />
        <FileList refreshTrigger={refreshTrigger} />
      </div>
    </Layout>
  );
}
