import { useState, useEffect } from "react";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [newJob, setNewJob] = useState({ title: '', description: '' });
  const [leaderboard, setLeaderboard] = useState({});
  const [uploading, setUploading] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [profileSummary, setProfileSummary] = useState(null);

  useEffect(() => {
    const savedJobs = JSON.parse(localStorage.getItem('jobs')) || [];
    setJobs(savedJobs);
    const savedLeaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
    setLeaderboard(savedLeaderboard);
  }, []);

  const saveJobs = (updatedJobs) => {
    localStorage.setItem('jobs', JSON.stringify(updatedJobs));
    setJobs(updatedJobs);
  };

  const createJob = () => {
    const id = Date.now().toString();
    const job = { id, title: newJob.title, description: newJob.description };
    const updatedJobs = [...jobs, job];
    saveJobs(updatedJobs);
    setNewJob({ title: '', description: '' });
    setSelectedJobId(id);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setUploading(true);
    const file = e.dataTransfer.files[0];

    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) {
      alert("No job selected.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('jobDescription', job.description);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert("Upload failed: " + (error.error || "Unknown error"));
        setUploading(false);
        return;
      }

      const data = await response.json();
      setMatchScore(data.matchScore);
      setProfileSummary(data.profileSummary);

      const updatedLeaderboard = {
        ...leaderboard,
        [selectedJobId]: [
          ...(leaderboard[selectedJobId] || []),
          {
            fileName: file.name,
            score: data.matchScore,
            summary: data.profileSummary
          }
        ]
      };
      setLeaderboard(updatedLeaderboard);
      localStorage.setItem("leaderboard", JSON.stringify(updatedLeaderboard));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: Something went wrong.");
    }

    setUploading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 p-4 border-r">
        <div className="space-y-2 mb-4">
          {jobs.map(job => (
            <div key={job.id}
              onClick={() => setSelectedJobId(job.id)}
              className={`p-3 border rounded cursor-pointer ${selectedJobId === job.id ? 'bg-gray-300' : 'bg-gray-200'}`}>
              <p className="font-semibold text-sm">{job.title}</p>
              <p className="text-xs text-gray-600">{job.description.slice(0, 30)}...</p>
            </div>
          ))}
        </div>
        <button onClick={() => setSelectedJobId(null)} className="mt-auto w-full p-2 bg-gray-300 hover:bg-gray-400 rounded">
          ➕ New Job
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {selectedJobId ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{jobs.find(j => j.id === selectedJobId)?.title}</h2>
                <p className="text-gray-600">{jobs.find(j => j.id === selectedJobId)?.description}</p>
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="p-4 w-60 text-center bg-white border-2 border-dashed border-gray-400 rounded cursor-pointer"
              >
                {uploading ? "Uploading..." : "📄 Drag & Drop CV Here"}
              </div>
            </div>

            <div className="bg-gray-200 p-4 rounded mb-4">
              <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
              <ul>
                {(leaderboard[selectedJobId] || []).map((entry, idx) => (
                  <li key={idx} className="mb-2">
                    <p className="font-medium">{entry.fileName} - {entry.score}%</p>
                    <p className="text-sm text-gray-700">{entry.summary}</p>
                  </li>
                ))}
              </ul>
            </div>

            {matchScore !== null && (
              <div className="mt-4 p-4 bg-white shadow rounded">
                <p className="text-lg font-bold">Match Score: {matchScore}%</p>
                <p className="mt-2">{profileSummary}</p>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold mb-4">Create New Job</h2>
            <input
              type="text"
              placeholder="Job Name"
              value={newJob.title}
              onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <textarea
              placeholder="Job Description"
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="w-full border p-2 rounded"
              rows={5}
            />
            <button onClick={createJob} className="bg-blue-600 text-white px-4 py-2 rounded">
              Save Job
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
