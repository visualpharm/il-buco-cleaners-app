"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CLEANER_PROFILES, CLEANER_STORAGE_KEYS, CleanerProfile } from '@/lib/cleaners'

export default function CleanerProfileSelect() {
  const router = useRouter()
  const [selectedCleaner, setSelectedCleaner] = useState<string | null>(null)

  useEffect(() => {
    // Check if a cleaner is already selected
    const storedCleanerId = localStorage.getItem(CLEANER_STORAGE_KEYS.CURRENT_CLEANER)
    if (storedCleanerId) {
      // Find the cleaner profile
      const cleaner = CLEANER_PROFILES.find(c => c.id === storedCleanerId)
      if (cleaner) {
        // Redirect to cleaner-specific URL (normalize name)
        const normalizedName = cleaner.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        router.push(`/h/${normalizedName}`)
      }
    }
  }, [router])

  const selectCleaner = (cleaner: CleanerProfile) => {
    setSelectedCleaner(cleaner.id)
    localStorage.setItem(CLEANER_STORAGE_KEYS.CURRENT_CLEANER, cleaner.id)
    
    // Brief animation before redirect
    setTimeout(() => {
      // Normalize name for URL (remove accents)
      const normalizedName = cleaner.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      router.push(`/h/${normalizedName}`)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ¿Quién está limpiando?
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {CLEANER_PROFILES.map((cleaner) => (
            <Card
              key={cleaner.id}
              className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                selectedCleaner === cleaner.id ? 'ring-4 ring-offset-2 ring-blue-500' : ''
              }`}
              onClick={() => selectCleaner(cleaner)}
            >
              <CardContent className="p-4">
                <div className={`${cleaner.color} w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center p-2`}>
                  <div 
                    className="w-full h-full" 
                    dangerouslySetInnerHTML={{ __html: cleaner.avatar.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"') }}
                  />
                </div>
                <h2 className="text-lg font-semibold text-center text-gray-900">
                  {cleaner.name}
                </h2>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}