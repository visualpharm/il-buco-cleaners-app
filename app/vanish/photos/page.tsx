'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// Using built-in Date methods instead of date-fns

interface PhotoItem {
  key: string;
  lastModified: Date;
  size: number;
  url: string;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `Hace ${minutes} min`;
  }
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    const minutes = Math.floor((diffInHours - hours) * 60);
    return `Hace ${hours} h ${minutes} m`;
  }
  
  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Check if this year
  if (date.getFullYear() === now.getFullYear()) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
};

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('/api/photos');
        if (!response.ok) {
          throw new Error('Error al cargar las fotos');
        }
        const data = await response.json();
        
        // Sort photos by date (newest first)
        const sortedPhotos = data.photos
          .map((photo: any) => ({
            ...photo,
            lastModified: new Date(photo.lastModified)
          }))
          .sort((a: PhotoItem, b: PhotoItem) => 
            b.lastModified.getTime() - a.lastModified.getTime()
          );
          
        setPhotos(sortedPhotos);
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('No se pudieron cargar las fotos. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Fotos subidas</h1>
      
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay fotos disponibles</p>
        </div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-2 py-1 border-b text-left">Foto</th>
              <th className="px-2 py-1 border-b text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((photo) => (
              <tr key={photo.key} className="hover:bg-gray-50">
                <td className="px-2 py-1 border-b">
                  <img
                    src={photo.url}
                    alt={`Foto subida el ${photo.lastModified.toLocaleString()}`}
                    width={20}
                    height={20}
                    style={{ width: 20, height: 20, objectFit: 'cover', display: 'block' }}
                  />
                </td>
                <td className="px-2 py-1 border-b align-middle">
                  <span className="text-sm text-gray-600">{formatDate(photo.lastModified)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
