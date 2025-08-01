import { useState, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState("summary");
  const [rewritten, setRewritten] = useState("");
  const [history, setHistory] = useState([]); // ✅ NEW

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setText(data.text);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    const res = await fetch("http://localhost:5000/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, section }),
    });
    const data = await res.json();
    setRewritten(data.rewritten);

    // ✅ Add to history list immediately after rewrite
    setHistory((prev) => [
      {
        text,
        section,
        rewritten: data.rewritten,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // ✅ Fetch history from backend on first load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:5000/history");
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6 space-y-10">
      <div className="w-full max-w-6xl bg-white p-6 rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-semibold text-center">AI Resume Rewriter</h1>

        <div className="space-y-4">
          <input type="file" onChange={handleFileChange} className="w-full border p-2" />
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Uploading..." : "Upload & Parse"}
          </button>
        </div>

        {text && (
          <div className="flex flex-col lg:flex-row gap-6 mt-4">
            {/* Left Side: Extracted + Rewrite Controls */}
            <div className="w-full lg:w-1/2 space-y-4">
              <div>
                <h2 className="text-lg font-medium">Extracted Text:</h2>
                <textarea
                  className="w-full h-64 p-2 border mt-2 text-sm font-mono bg-gray-50 rounded"
                  value={text}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="section">Select Section to Rewrite:</label>
                <select
                  id="section"
                  className="border px-3 py-2 rounded w-full"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option value="summary">Summary</option>
                  <option value="experience">Experience</option>
                  <option value="skills">Skills</option>
                  <option value="education">Education</option>
                </select>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
                  onClick={handleRewrite}
                >
                  ✨ Rewrite {section} with AI
                </button>
              </div>
            </div>

            {/* Right Side: Rewritten Output */}
            <div className="w-full lg:w-1/2">
              <h2 className="text-lg font-medium mb-2">
                Rewritten {section}:
              </h2>
              <div className="bg-gray-50 border p-4 rounded text-sm whitespace-pre-wrap h-64 overflow-auto">
                {rewritten ? (
                  <p>{rewritten}</p>
                ) : (
                  <p className="italic text-gray-400">
                    Output will appear here after rewrite...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ HISTORY Section */}
      {history.length > 0 && (
        <div className="w-full max-w-6xl bg-white p-6 rounded-xl shadow-lg space-y-4">
          <h2 className="text-xl font-semibold">🕘 Rewrite History</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto text-sm">
            {history.map((entry, idx) => (
              <div key={idx} className="border p-4 rounded bg-gray-50">
                <p><strong>Section:</strong> {entry.section}</p>
                <p><strong>Original:</strong> {entry.text.slice(0, 100)}...</p>
                <p><strong>Rewritten:</strong> {entry.rewritten}</p>
                <p className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
