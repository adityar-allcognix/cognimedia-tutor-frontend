import { useEffect, useState } from "react";

import { AppLayout } from "@/components/AppLayout";
import { createStudyMaterial, downloadStudyMaterial, getStudyMaterials, uploadStudyMaterial } from "@/lib/api";
import { getUser } from "@/lib/user";

export default function MaterialsPage() {
  const user = getUser();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Science");
  const [grade, setGrade] = useState(user?.grade ?? 10);
  const [description, setDescription] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const API_HOST = "http://localhost:8000";

  const isTeacher = user?.role === "teacher";

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getStudyMaterials();
      setMaterials(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const onDownload = async (material: any) => {
    const ext = material?.content_url?.split(".")?.pop();
    const name = ext ? `${material.title}.${ext}` : material.title;
    await downloadStudyMaterial(material.id, name);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      await uploadStudyMaterial({
        title,
        subject,
        grade,
        description: description || undefined,
        file: selectedFile,
      });
    } else {
      await createStudyMaterial({
        title,
        subject,
        grade,
        description: description || undefined,
        content_url: contentUrl || undefined,
        content_text: contentText || undefined,
      });
    }
    setTitle("");
    setDescription("");
    setContentUrl("");
    setContentText("");
    setSelectedFile(null);
    await loadMaterials();
  };

  const toMaterialUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("/")) return `${API_HOST}${url}`;
    return url;
  };

  const isImage = (url?: string) =>
    !!url && /\.(png|jpe?g|gif|webp)$/i.test(url);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
          <p className="text-muted-foreground">Teacher uploads and school-shared learning resources.</p>
        </div>

        {isTeacher ? (
          <form onSubmit={onSubmit} className="rounded-xl border bg-card p-4 space-y-3">
            <h2 className="font-semibold">Upload New Material</h2>
            <input className="w-full rounded-md border px-3 py-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="w-full rounded-md border px-3 py-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <select className="w-full rounded-md border px-3 py-2" value={grade} onChange={(e) => setGrade(parseInt(e.target.value))}>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>Class {g}</option>)}
              </select>
            </div>
            <input className="w-full rounded-md border px-3 py-2" placeholder="Document URL (optional)" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
            <div className="space-y-1">
              <label
                htmlFor="material-file-upload"
                className="block rounded-lg border border-dashed border-border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Choose material file</p>
                    <p className="text-xs text-muted-foreground">Click to browse from your device</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md border bg-background text-muted-foreground">
                    image / pdf / doc
                  </span>
                </div>
                {selectedFile ? (
                  <p className="mt-2 text-xs text-foreground">
                    Selected: <span className="font-medium">{selectedFile.name}</span>
                  </p>
                ) : null}
              </label>
              <input
                id="material-file-upload"
                className="hidden"
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">Allowed: image, PDF, DOC, DOCX (max 15MB)</p>
            </div>
            <textarea className="w-full rounded-md border px-3 py-2" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            <textarea className="w-full rounded-md border px-3 py-2" placeholder="Material content (optional)" value={contentText} onChange={(e) => setContentText(e.target.value)} rows={4} />
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground" type="submit">Publish Material</button>
          </form>
        ) : null}

        {loading ? (
          <p className="text-muted-foreground">Loading materials...</p>
        ) : materials.length === 0 ? (
          <p className="text-muted-foreground">No materials published yet.</p>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{material.title}</h3>
                  <span className="text-xs text-muted-foreground">{material.subject} - Class {material.grade}</span>
                </div>
                {(material.uploaded_by_name || material.uploaded_by_email) ? (
                  <p className="text-xs text-muted-foreground mb-2">
                    Uploaded by {material.uploaded_by_name || "Teacher"}
                    {material.uploaded_by_email ? ` (${material.uploaded_by_email})` : ""}
                  </p>
                ) : null}
                {material.description ? <p className="text-sm text-muted-foreground mb-2">{material.description}</p> : null}
                {material.content_url ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <a className="text-sm text-primary hover:underline" href={toMaterialUrl(material.content_url)} target="_blank" rel="noreferrer">
                        Open document
                      </a>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => onDownload(material)}
                      >
                        Download
                      </button>
                    </div>
                    {isImage(material.content_url) ? (
                      <img
                        src={toMaterialUrl(material.content_url)}
                        alt={material.title}
                        className="max-h-72 rounded-md border"
                      />
                    ) : null}
                  </div>
                ) : null}
                {material.content_text ? <p className="text-sm mt-2 text-foreground/90 whitespace-pre-wrap">{material.content_text}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
