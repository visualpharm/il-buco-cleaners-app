import { redirect } from 'next/navigation'
import { CLEANER_PROFILES } from "@/lib/cleaners"

export default function CleanerPage({ params }: { params: { cleanername: string } }) {
  // Find cleaner by name (case-insensitive and accent-insensitive)
  const cleaner = CLEANER_PROFILES.find(
    c => c.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') === params.cleanername.toLowerCase()
  )

  if (!cleaner) {
    // If cleaner not found, redirect to profile selection
    redirect('/profile')
  }

  // Redirect to main page - the main page will handle setting the cleaner
  // We'll pass the cleaner ID as a query parameter
  redirect(`/?cleaner=${cleaner.id}`)
}