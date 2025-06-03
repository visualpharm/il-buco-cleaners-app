import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import React from 'react';
import config from '../../config/r2.config';

if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
  console.error('Missing required R2 configuration. Photo listing will fail.');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: config.endpoint,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

const BUCKET = config.bucketName;

export async function getServerSideProps() {
  const params = {
    Bucket: BUCKET,
    Prefix: 'cleaners/',
  };
  let images = [];
  try {
    const data = await s3.send(new ListObjectsV2Command(params));
    images = (data.Contents || [])
      .filter(obj => obj.Key.match(/\.(jpg|jpeg|png|gif)$/i))
      .map(obj => ({
        url: `${config.publicBaseUrl}/${obj.Key}`,
        key: obj.Key,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : null,
      }))
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  } catch (e) {
    // handle error if needed
  }
  return { props: { images } };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  // Always use UTC to avoid hydration mismatch between server and client
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

export default function Photos({ images }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Cleaner Images</h1>
      {images.length === 0 && <div>No images found.</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {images.map(img => (
          <div key={img.key} style={{ border: '1px solid #eee', padding: 8 }}>
            <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              {/* Show image only if URL is present */}
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.key}
                  style={{ maxWidth: 200, maxHeight: 200, display: 'block' }}
                  onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: 200, height: 200, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No image
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 14 }}>
                {formatDate(img.lastModified)}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>{img.key}</div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
