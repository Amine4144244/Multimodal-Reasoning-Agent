import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('analyze');

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !prompt) return alert('Please provide both image and prompt');

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('image', image);
    formData.append('prompt', prompt);

    try {
      const res = await axios.post('http://localhost:5000/api/analyze', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Error analyzing image. Make sure backend and AI service are running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-blue-400">Multimodal Reasoning Agent</h1>
          <p className="text-gray-400 mt-2">Upload an image and a prompt to get structured JSON analysis.</p>
        </header>
        
        <div className="flex justify-center space-x-4 border-b border-gray-700 pb-4">
          <button 
            className={`px-4 py-2 font-semibold ${activeTab === 'analyze' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('analyze')}
          >
            Analyze
          </button>
          <button 
            className={`px-4 py-2 font-semibold ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {activeTab === 'analyze' && (
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-xl space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700"
                />
                {preview && <img src={preview} alt="Preview" className="mt-4 max-h-64 rounded-md shadow-md object-contain" />}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Prompt</label>
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Analyze my spending from this receipt"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 transition py-3 rounded-md font-semibold shadow-lg"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </form>

            {result && (
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl space-y-4 animate-fade-in-up">
                <h2 className="text-2xl font-semibold text-blue-300">Analysis Result</h2>
                <div className="flex gap-4 mb-4">
                  <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm font-medium">
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </span>
                  {result.needsReview && (
                    <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-sm font-medium">
                      Needs Review
                    </span>
                  )}
                </div>
                <div className="bg-gray-900 p-4 rounded-md overflow-x-auto border border-gray-700">
                   <pre className="text-sm text-green-400 font-mono">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Past Analyses</h2>
            {history.length === 0 ? (
              <p className="text-gray-400">No history found.</p>
            ) : (
              history.map((item) => (
                <div key={item._id} className="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <img src={`http://localhost:5000${item.imageUrl}`} alt="Analyzed" className="rounded-md object-cover w-full h-48" />
                  </div>
                  <div className="w-full md:w-2/3 space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-blue-300">Prompt</h3>
                      <p className="text-gray-300 italic">"{item.userPrompt}"</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-xs font-medium">
                        Confidence: {(item.confidence * 100).toFixed(0)}%
                      </span>
                      {item.needsReview && (
                        <span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-xs font-medium">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-300 mb-2">Result JSON</h3>
                      <div className="bg-gray-900 p-4 rounded-md overflow-x-auto border border-gray-700 max-h-48 overflow-y-auto">
                        <pre className="text-xs text-green-400 font-mono">
                          {JSON.stringify(item.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
