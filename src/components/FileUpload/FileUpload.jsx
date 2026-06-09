import React from 'react';
import './FileUpload.scss';

export default function FileUpload({ onUpload, loading }) {
  return (
    <div className="file-upload-container">
      <label className={`upload-btn ${loading ? 'loading' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {loading ? 'Đang xử lý dữ liệu...' : 'Import File Excel'}
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={onUpload} 
          disabled={loading}
        />
      </label>
    </div>
  );
}