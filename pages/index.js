import { useState, useEffect } from "react";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [newJob, setNewJob] = useState({ title: '', description: '' });
  const [leaderboard, setLeaderboard] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const savedJobs = JSON.parse(localStorage.getItem('jobs')) || [];
    setJobs(savedJobs);
  }, []);

  const saveJobs = (jobs) => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
    setJobs(jobs);
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
    const file = e.dataTransfer.files[0];
    const job = jobs.find(j => j.id === selectedJobId);
    setUploading(true);

    const formData = new FormData();
    formData.append('cv', file);
    formData.append('jobDescription', job.description);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    const updatedLeaderboard = {
      ...leaderboard,
      [selectedJobId]: [
        ...(leaderboard[selectedJobId] || []),
        { fileName: file.name, score: data.matchScore, summary: data.profileSummary }
      ]
    };
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('leaderboard', JSON.stringify(updatedLeaderboard));
    setUploading(false);
  };

  useEffect(() => {
    const savedLeaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
    setLeaderboard(savedLeaderboard);
  }, []);

  return (
    <div className="flex min-h-screen">
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
          New Job
        </button>
      </aside>

      <main className="flex-1 p-6">
        {selectedJobId ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">{jobs.find(j => j.id === selectedJobId)?.title}</h2>
                <p className="text-gray-600">{jobs.find(j => j.id === selectedJobId)?.description}</p>
              </div>
              <div>
                <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                     className="p-3 bg-gray-200 border-dashed border-2 rounded cursor-pointer">
                  {uploading ? 'Uploading...' : 'Upload New CV (Drag & Drop)'}
                </div>
              </div>
            </div>
            <div className="bg-gray-200 p-4 rounded">
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
