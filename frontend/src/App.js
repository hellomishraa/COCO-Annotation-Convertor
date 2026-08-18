import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://backend-coco-cvat.onrender.com'; // For localhost, remove the line.

function App() {
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [imageLinks, setImageLinks] = useState({});
  const [images, setImages] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageMasks, setImageMasks] = useState({});
  const [compressFile, setCompressFile] = useState(null);
  const [compressOriginalFilename, setCompressOriginalFilename] = useState('');
  const [compressDownloadUrl, setCompressDownloadUrl] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressExt, setCompressExt] = useState(null);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressError, setCompressError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const toggleTheme = () => setDarkMode(!darkMode);
  const [masksLoading, setMasksLoading] = useState(false); // For Wait message

  // Track connectivity so we can warn the user / block actions when offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setUploadStatus('');
    setDownloadUrl(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      // const res = await axios.post('http://127.0.0.1:8085/get-categories', formData);
      const res = await axios.post(`${API_BASE}/get-categories`, formData); // For render backend
      setCategories(res.data);
      setUploadStatus('✅ File uploaded successfully!');

      // Loading message for mask.
      setMasksLoading(true);
      let maskForm = new FormData();
      maskForm.append('file', uploadedFile);
      // let maskRes = await axios.post('http://127.0.0.1:8085/preview-masks', maskForm);
      let maskRes = await axios.post(`${API_BASE}/preview-masks`, maskForm);
      setImageMasks(maskRes.data);
      setMasksLoading(false);

      const reader = new FileReader();
      reader.onload = () => {
        const data = JSON.parse(reader.result);
        const imgs = data.images.map((img) => ({ id: img.id, name: img.file_name }));
        setImages(imgs);
        const linkMap = {};
        imgs.forEach((img) => {
          linkMap[img.name] = '';
        });
        setImageLinks(linkMap);
      };
      reader.readAsText(uploadedFile);

    } catch {
      setUploadStatus('❌ Upload failed!');
    }

    setIsUploading(false);
  };

  const handleCategoryChange = (e) => {
    const selected = [...e.target.options].filter(o => o.selected).map(o => o.value);
    setSelectedCategories(selected);
  };

  const handleLinkChange = (fileName, url) => {
    setImageLinks({ ...imageLinks, [fileName]: url });
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('file', file);
    selectedCategories.forEach(cat => formData.append('categories[]', cat));
    formData.append('filename_to_url', JSON.stringify(imageLinks));

    setIsUploading(true);
    try {
      // const res = await axios.post('http://127.0.0.1:8085/process', formData, { responseType: 'blob' });
      const res = await axios.post(`${API_BASE}/process`, formData, { responseType: 'blob' }); // For render backend
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(url);
    } catch (err) {
      alert("❌ Processing failed");
    }
    setIsUploading(false);
  };

  const handleCompress = async () => {
    if (!compressFile) return;

    // Guard: don't even attempt the request if the browser knows we're offline
    if (!navigator.onLine) {
      setCompressError('❌ No internet connection. Please check your network and try again.');
      return;
    }

    setCompressError('');
    setCompressDownloadUrl(null);
    setCompressProgress(0);
    setIsCompressing(true);

    const formData = new FormData();
    formData.append('file', compressFile);

    try {
      const res = await axios.post(`${API_BASE}/get-compressed-image`, formData, {
      // const res = await axios.post('http://127.0.0.1:8085/get-compressed-image', formData, {
        responseType: 'blob',
        timeout: 30000, // abort if the request stalls for 30s (e.g. very weak connection)
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setCompressProgress(percent);
          }
        },
      });

      const contentType = res.headers['content-type'] || 'application/octet-stream';

      // If the server (or a proxy, in case of a flaky connection) returned JSON/HTML
      // instead of image bytes, treat it as an error instead of "succeeding" with junk data.
      if (contentType.includes('application/json') || contentType.includes('text/html')) {
        const text = await res.data.text();
        let message = 'Unexpected response from server.';
        try { message = JSON.parse(text).error || message; } catch { /* keep default message */ }
        throw new Error(message);
      }

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Derive extension from content-type so the filename matches (e.g. "png", "jpeg")
      const ext = contentType.split('/')[1] || 'png';

      setCompressDownloadUrl(url);
      setCompressExt(ext); // used to build filename with correct extension
    } catch (err) {
      console.error('Compression error:', err);
      let message = err.message;

      if (err.code === 'ECONNABORTED') {
        message = 'Request timed out — your connection may be too slow. Please try again.';
      } else if (!err.response) {
        message = 'Network error — could not reach the server. Check your internet connection.';
      } else if (err.response.data instanceof Blob) {
        // responseType: 'blob' means even error bodies arrive as Blobs, not parsed JSON
        try {
          const text = await err.response.data.text();
          message = JSON.parse(text).error || text;
        } catch {
          // leave message as-is
        }
      } else if (err.response.data?.error) {
        message = err.response.data.error;
      }

      setCompressError('❌ ' + message);
    } finally {
      setIsCompressing(false);
      setCompressProgress(0);
    }
  };

  const themeClass = darkMode ? 'dark' : 'light';

  return (
    <div className={`app ${themeClass}`} style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: darkMode ? '#121212' : '#f5f5f5',
      color: darkMode ? '#eee' : '#111',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            padding: '6px 14px',
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
          }}>
            <img
              src="https://naimgcdn.nirwana.ai/catalog/temp/nirwanabest.webp"
              alt="Nirwana logo"
              style={{ height: '28px', width: 'auto', display: 'block' }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>
              Powered by Nirwana
            </span>
          </div>
        </div>
        <h1 style={{ textAlign: 'center' }}><b>🔄 COCO Annotation Converter</b></h1>

        {/* Offline banner */}
        {!isOnline && (
          <div style={{
            background: '#ffdddd',
            color: '#900',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '10px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            ⚠️ You're offline. Some features won't work until your connection is back.
          </div>
        )}

        {/* Compress Image - Top Left */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 'bold' }}>🗜️ Compress Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selectedFile = e.target.files[0];
                setCompressFile(selectedFile);
                if (selectedFile) {
                  // Extract filename without extension
                  const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
                  setCompressOriginalFilename(nameWithoutExt);
                }
                setCompressDownloadUrl(null);
                setCompressError('');
                setCompressProgress(0);
              }}
            />
            <button onClick={handleCompress} disabled={isCompressing || !compressFile || !isOnline}>
              {isCompressing
                ? (compressProgress > 0 && compressProgress < 100
                    ? `⏳ Uploading ${compressProgress}%`
                    : '⏳ Compressing...')
                : 'Compress'}
            </button>
            {compressDownloadUrl && (
              <a href={compressDownloadUrl} download={`${compressOriginalFilename || 'image'}_compressed.png`}>📥 Download</a>
            )}
          </div>

          {/* Upload progress bar */}
          {isCompressing && (
            <div style={{
              width: '100%',
              maxWidth: '300px',
              background: '#ddd',
              borderRadius: '4px',
              height: '8px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${compressProgress}%`,
                background: '#4caf50',
                height: '100%',
                transition: 'width 0.2s ease'
              }} />
            </div>
          )}

          {/* Error message */}
          {compressError && (
            <p style={{ color: '#c00', fontWeight: 'bold', marginTop: '6px' }}>{compressError}</p>
          )}
        </div>

        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
          <button onClick={toggleTheme}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <details style={{ marginBottom: '20px', background: darkMode ? '#1e1e1e' : '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ccc' }}>
          <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>ℹ️ About the Tool</summary>
          <div style={{ marginTop: '10px', lineHeight: '1.6' }}>
            <p>This tool allows you to upload a COCO-format JSON file (exported from CVAT with segmentation masks), filter by category, manually assign image URLs for each file, and generate a new JSON file with:</p>
            <ul>
              <li>📌 Base64-encoded binary masks per annotation</li>
              <li>🖼️ Manually inputted <code>image_url</code> for each image (user-provided)</li>
              <li>📁 Organized output by image filename and category</li>
            </ul>

            <p><strong>✅ How to Use:</strong></p>
            <ol>
              <li>Upload your COCO JSON file using the upload button.</li>
              <li>Select the categories you want to include.</li>
              <li>Enter a valid image URL for each image shown by filename.</li>
              <li>Click “Process” to generate the output.</li>
              <li>Download the resulting JSON file.</li>
            </ol>

            <p><strong>Note:</strong></p>
            <ul>
              <li>Matching is done based on exact image <code>file_name</code> as listed in the COCO file.</li>
              <li>Ensure you provide a URL for each image before processing.</li>
            </ul>

            <p><strong>Checks:</strong></p>
            <ul>
              <li>❌ Duplicate Links are not allowed</li>
              <li>✅ Verifies the image link</li>
              <li>📏 Verifies the dimension of the image (Image from the link and the one in the input payload)</li>
            </ul>
          </div>
        </details>

        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{
            display: 'block',
            padding: '10px',
            fontSize: '18px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            background: darkMode ? '#1e1e1e' : '#fff',
            color: darkMode ? '#eee' : '#111',
            width: '100%',
            boxSizing: 'border-box',
            marginTop: '10px',
            marginBottom: '10px'
          }}
/>
        {masksLoading && (
          <p style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '10px' }}>
            🧠 Masks loading, please wait...
          </p>
        )}

        {uploadStatus && <p style={{ marginTop: '5px', fontWeight: 'bold' }}>{uploadStatus}</p>}

        <div style={{ marginTop: '20px' }}>
          <label>Categories:</label><br />
          <select multiple value={selectedCategories} onChange={handleCategoryChange} style={{ width: '100%', height: '100px' }}>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label>Image Links:</label>
          {images.map((img) => (
            <div key={img.id} style={{ marginBottom: '20px' }}>
              <div><strong>{img.name}</strong> (ID: {img.id})</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Paste image URL here..."
                  value={imageLinks[img.name] || ''}
                  onChange={(e) => handleLinkChange(img.name, e.target.value)}
                  style={{ width: '100%' }}
                />
                {imageLinks[img.name] && (
                  <img
                    src={imageLinks[img.name]}
                    alt="thumbnail"
                    style={{ width: '160px', height: 'auto', marginLeft: '10px', borderRadius: '4px' }}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
              </div>

              {imageMasks[img.name] && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {imageMasks[img.name].map((mask, i) => (
                    <img key={i} src={mask} alt={`mask-${i}`} style={{ width: '160px', border: '1px solid #ccc' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          style={{
            marginTop: '20px',
            background: 'green',
            color: 'white',
            padding: '10px 20px',
            cursor: 'pointer',
            width: '100%'
          }}
          disabled={isUploading}
        >
          {isUploading ? '⏳ Processing...' : 'Process'}
        </button>

        {downloadUrl && (
          <div style={{ marginTop: '20px' }}>
            <a href={downloadUrl} download="converted_annotations.json" style={{ textDecoration: 'none', color: 'blue' }}><h3><b>📁 Download Result</b></h3></a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
