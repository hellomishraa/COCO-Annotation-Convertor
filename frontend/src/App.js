// // V1 Starts
// import React, { useState } from 'react';
// import axios from 'axios';

// function App() {
//   const [file, setFile] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategories, setSelectedCategories] = useState([]);
//   const [imageLinks, setImageLinks] = useState({});
//   const [downloadUrl, setDownloadUrl] = useState(null);
//   const [images, setImages] = useState([]);

//   const handleFileChange = async (e) => {
//     const uploadedFile = e.target.files[0];
//     setFile(uploadedFile);
//     setDownloadUrl(null);
//     const formData = new FormData();
//     formData.append('file', uploadedFile);
//     const res = await axios.post('http://127.0.0.1:5000/get-categories', formData);
//     setCategories(res.data);

//     const reader = new FileReader();
//     reader.onload = () => {
//       const data = JSON.parse(reader.result);
//       const imgs = data.images.map((img) => ({ id: img.id, name: img.file_name }));
//       setImages(imgs);
//       const linkMap = {};
//       imgs.forEach((img) => {
//         linkMap[img.name] = '';
//       });
//       setImageLinks(linkMap);
//     };
//     reader.readAsText(uploadedFile);
//   };

//   const handleCategoryChange = (e) => {
//     const options = [...e.target.options];
//     const selected = options.filter((o) => o.selected).map((o) => o.value);
//     setSelectedCategories(selected);
//   };

//   const handleLinkChange = (fileName, url) => {
//     setImageLinks({ ...imageLinks, [fileName]: url });
//   };

//   const handleSubmit = async () => {
//     const formData = new FormData();
//     formData.append('file', file);
//     selectedCategories.forEach(cat => formData.append('categories[]', cat));
//     formData.append('filename_to_url', JSON.stringify(imageLinks));
//     const res = await axios.post('http://127.0.0.1:5000/process', formData, { responseType: 'blob' });
//     const url = window.URL.createObjectURL(new Blob([res.data]));
//     setDownloadUrl(url);
//   };

//   return (
//     <div style={{ padding: '20px', fontFamily: 'Arial' }}>
//       <h1><b>🔄 COCO Annotation Converter</b></h1>

//       <input type="file" accept=".json" onChange={handleFileChange} />

//       <div style={{ marginTop: '20px' }}>
//         <label>Categories:</label>
//         <select multiple value={selectedCategories} onChange={handleCategoryChange} style={{ width: '200px', height: '100px' }}>
//           {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
//         </select>
//       </div>

//       <div style={{ marginTop: '20px' }}>
//         <label>Image Links:</label>
//         {images.map((img) => (
//           <div key={img.id} style={{ marginBottom: '10px' }}>
//             <div>{img.name} (ID: {img.id})</div>
//             <input
//               type="text"
//               placeholder="Paste image URL here..."
//               value={imageLinks[img.name] || ''}
//               onChange={(e) => handleLinkChange(img.name, e.target.value)}
//               style={{ width: '100%' }}
//             />
//           </div>
//         ))}
//       </div>

//       <button onClick={handleSubmit} style={{ marginTop: '20px', background: 'green', color: 'white', padding: '10px 20px' }}>
//         Process
//       </button>

//       {downloadUrl && (
//         <div style={{ marginTop: '20px' }}>
//           <a href={downloadUrl} download="converted_annotations.json">📁 Download Result</a>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

// // V1 Ends

// // V2 Starts
// import React, { useState } from 'react';
// import axios from 'axios';

// function App() {
//   const [file, setFile] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategories, setSelectedCategories] = useState([]);
//   const [imageLinks, setImageLinks] = useState({});
//   const [images, setImages] = useState([]);
//   const [downloadUrl, setDownloadUrl] = useState(null);
//   const [darkMode, setDarkMode] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState('');

//   const toggleTheme = () => setDarkMode(!darkMode);

//   const handleFileChange = async (e) => {
//     const uploadedFile = e.target.files[0];
//     if (!uploadedFile) return;
//     setFile(uploadedFile);
//     setUploadStatus('');
//     setDownloadUrl(null);
//     setIsUploading(true);

//     const formData = new FormData();
//     formData.append('file', uploadedFile);
//     try {
//       const res = await axios.post('http://127.0.0.1:5000/get-categories', formData);
//       setCategories(res.data);
//       setUploadStatus('✅ File uploaded successfully!');

//       const reader = new FileReader();
//       reader.onload = () => {
//         const data = JSON.parse(reader.result);
//         const imgs = data.images.map((img) => ({ id: img.id, name: img.file_name }));
//         setImages(imgs);

//         const linkMap = {};
//         imgs.forEach((img) => {
//           linkMap[img.name] = '';
//         });
//         setImageLinks(linkMap);
//       };
//       reader.readAsText(uploadedFile);
//     } catch {
//       setUploadStatus('❌ Upload failed!');
//     }
//     setIsUploading(false);
//   };

//   const handleCategoryChange = (e) => {
//     const selected = [...e.target.options].filter(o => o.selected).map(o => o.value);
//     setSelectedCategories(selected);
//   };

//   const handleLinkChange = (fileName, url) => {
//     setImageLinks({ ...imageLinks, [fileName]: url });
//   };

//   const handleSubmit = async () => {
//     const formData = new FormData();
//     formData.append('file', file);
//     selectedCategories.forEach(cat => formData.append('categories[]', cat));
//     formData.append('filename_to_url', JSON.stringify(imageLinks));

//     setIsUploading(true);
//     try {
//       const res = await axios.post('http://127.0.0.1:5000/process', formData, { responseType: 'blob' });
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       setDownloadUrl(url);
//     } catch (err) {
//       alert("❌ Processing failed");
//     }
//     setIsUploading(false);
//   };

//   const themeClass = darkMode ? 'dark' : 'light';

//   return (
//     <div className={`app ${themeClass}`} style={{
//       minHeight: '100vh',
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       background: darkMode ? '#121212' : '#f5f5f5',
//       color: darkMode ? '#eee' : '#111',
//       padding: '20px'
//     }}>
//       <div style={{ maxWidth: '600px', width: '100%' }}>
//         <h2 style={{ textAlign: 'center' }}>🔄 COCO Annotation Converter</h2>

//         <div style={{ textAlign: 'right', marginBottom: '10px' }}>
//           <button onClick={toggleTheme}>
//             {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
//           </button>
//         </div>

//         <input type="file" accept=".json" onChange={handleFileChange} />
//         {uploadStatus && <p style={{ marginTop: '5px', fontWeight: 'bold' }}>{uploadStatus}</p>}

//         <div style={{ marginTop: '20px' }}>
//           <label>Categories:</label><br />
//           <select multiple value={selectedCategories} onChange={handleCategoryChange} style={{ width: '100%', height: '100px' }}>
//             {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
//           </select>
//         </div>

//         <div style={{ marginTop: '20px' }}>
//           <label>Image Links:</label>
//           {images.map((img) => (
//             <div key={img.id} style={{ marginBottom: '10px' }}>
//               <div>{img.name} (ID: {img.id})</div>
//               <input
//                 type="text"
//                 placeholder="Paste image URL here..."
//                 value={imageLinks[img.name] || ''}
//                 onChange={(e) => handleLinkChange(img.name, e.target.value)}
//                 style={{ width: '100%' }}
//               />
//             </div>
//           ))}
//         </div>

//         <button
//           onClick={handleSubmit}
//           style={{
//             marginTop: '20px',
//             background: 'green',
//             color: 'white',
//             padding: '10px 20px',
//             cursor: 'pointer',
//             width: '100%'
//           }}
//           disabled={isUploading}
//         >
//           {isUploading ? '⏳ Processing...' : 'Process'}
//         </button>

//         {downloadUrl && (
//           <div style={{ marginTop: '20px' }}>
//             <a href={downloadUrl} download="converted_annotations.json">📁 Download Result</a>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;

// // V2 Ends

// V3 Starts
// import React, { useState } from 'react';
// import axios from 'axios';

// function App() {
//   const [file, setFile] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategories, setSelectedCategories] = useState([]);
//   const [imageLinks, setImageLinks] = useState({});
//   const [images, setImages] = useState([]);
//   const [downloadUrl, setDownloadUrl] = useState(null);
//   const [darkMode, setDarkMode] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState('');
//   const [imageMasks, setImageMasks] = useState({});

//   const toggleTheme = () => setDarkMode(!darkMode);

//   const handleFileChange = async (e) => {
//     const uploadedFile = e.target.files[0];
//     if (!uploadedFile) return;
//     setFile(uploadedFile);
//     setUploadStatus('');
//     setDownloadUrl(null);
//     setIsUploading(true);

//     try {
//       const formData = new FormData();
//       formData.append('file', uploadedFile);
//       const res = await axios.post('http://127.0.0.1:5000/get-categories', formData);
//       setCategories(res.data);
//       setUploadStatus('✅ File uploaded successfully!');

//       const reader = new FileReader();
//       reader.onload = () => {
//         const data = JSON.parse(reader.result);
//         const imgs = data.images.map((img) => ({ id: img.id, name: img.file_name }));
//         setImages(imgs);
//         const linkMap = {};
//         imgs.forEach((img) => {
//           linkMap[img.name] = '';
//         });
//         setImageLinks(linkMap);
//       };
//       reader.readAsText(uploadedFile);

//       const maskForm = new FormData();
//       maskForm.append('file', uploadedFile);
//       const maskRes = await axios.post('http://127.0.0.1:5000/preview-masks', maskForm);
//       setImageMasks(maskRes.data);

//     } catch {
//       setUploadStatus('❌ Upload failed!');
//     }

//     setIsUploading(false);
//   };

//   const handleCategoryChange = (e) => {
//     const selected = [...e.target.options].filter(o => o.selected).map(o => o.value);
//     setSelectedCategories(selected);
//   };

//   const handleLinkChange = (fileName, url) => {
//     setImageLinks({ ...imageLinks, [fileName]: url });
//   };

//   const handleSubmit = async () => {
//     const formData = new FormData();
//     formData.append('file', file);
//     selectedCategories.forEach(cat => formData.append('categories[]', cat));
//     formData.append('filename_to_url', JSON.stringify(imageLinks));

//     setIsUploading(true);
//     try {
//       const res = await axios.post('http://127.0.0.1:5000/process', formData, { responseType: 'blob' });
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       setDownloadUrl(url);
//     } catch (err) {
//       alert("❌ Processing failed");
//     }
//     setIsUploading(false);
//   };

//   const themeClass = darkMode ? 'dark' : 'light';

//   return (
//     <div className={`app ${themeClass}`} style={{
//       minHeight: '100vh',
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       background: darkMode ? '#121212' : '#f5f5f5',
//       color: darkMode ? '#eee' : '#111',
//       padding: '20px'
//     }}>
//       <div style={{ maxWidth: '700px', width: '100%' }}>
//         <h1 style={{ textAlign: 'center' }}><b>🔄 COCO Annotation Converter</b></h1>

//         <div style={{ textAlign: 'right', marginBottom: '10px' }}>
//           <button onClick={toggleTheme}>
//             {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
//           </button>
//         </div>

//         <input type="file" accept=".json" onChange={handleFileChange} />
//         {uploadStatus && <p style={{ marginTop: '5px', fontWeight: 'bold' }}>{uploadStatus}</p>}

//         <div style={{ marginTop: '20px' }}>
//           <label>Categories:</label><br />
//           <select multiple value={selectedCategories} onChange={handleCategoryChange} style={{ width: '100%', height: '100px' }}>
//             {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
//           </select>
//         </div>

//         <div style={{ marginTop: '20px' }}>
//           <label>Image Links:</label>
//           {images.map((img) => (
//             <div key={img.id} style={{ marginBottom: '20px' }}>
//               <div><strong>{img.name}</strong> (ID: {img.id})</div>
//               <div style={{ display: 'flex', alignItems: 'center' }}>
//                 <input
//                   type="text"
//                   placeholder="Paste image URL here..."
//                   value={imageLinks[img.name] || ''}
//                   onChange={(e) => handleLinkChange(img.name, e.target.value)}
//                   style={{ width: '100%' }}
//                 />
//                 {imageLinks[img.name] && (
//                   <img
//                     src={imageLinks[img.name]}
//                     alt="thumbnail"
//                     style={{ width: '200px', height: 'auto', marginLeft: '10px', borderRadius: '4px' }}
//                     onError={(e) => (e.target.style.display = 'none')}
//                   />
//                 )}
//               </div>

//               {imageMasks[img.name] && (
//                 <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
//                   {imageMasks[img.name].map((mask, i) => (
//                     <img key={i} src={mask} alt={`mask-${i}`} style={{ width: '200px', border: '1px solid #ccc' }} />
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         <button
//           onClick={handleSubmit}
//           style={{
//             marginTop: '20px',
//             background: 'green',
//             color: 'white',
//             padding: '10px 20px',
//             cursor: 'pointer',
//             width: '100%'
//           }}
//           disabled={isUploading}
//         >
//           {isUploading ? '⏳ Processing...' : 'Process'}
//         </button>

//         {downloadUrl && (
//           <div style={{ marginTop: '20px' }}>
//             <a href={downloadUrl} download="converted_annotations.json"><h3><b>📁 Download Result</b></h3></a>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;

// // V3 Ends

// V4 Starts
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'https://backend-coco-cvat.onrender.com';

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

  const toggleTheme = () => setDarkMode(!darkMode);

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
      // const res = await axios.post('http://127.0.0.1:5000/get-categories', formData);
      const res = await axios.post(`${API_BASE}/get-categories`, formData);
      setCategories(res.data);
      setUploadStatus('✅ File uploaded successfully!');

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

      const maskForm = new FormData();
      maskForm.append('file', uploadedFile);
      // const maskRes = await axios.post('http://127.0.0.1:5000/preview-masks', maskForm);
      const maskRes = await axios.post(`${API_BASE}/preview-masks`, maskForm);
      setImageMasks(maskRes.data);

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
      // const res = await axios.post('http://127.0.0.1:5000/process', formData, { responseType: 'blob' });
      const res = await axios.post(`${API_BASE}/process`, formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      setDownloadUrl(url);
    } catch (err) {
      alert("❌ Processing failed");
    }
    setIsUploading(false);
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
        <h1 style={{ textAlign: 'center' }}><b>🔄 COCO Annotation Converter</b></h1>

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

// V4 Ends
