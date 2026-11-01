import { useCallback, useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Publications from './components/Publications'
import AwardsSection from './components/AwardsSection'
import ExperienceSection from './components/ExperienceSection'
import EducationSection from './components/EducationSection'
import NewsSection from './components/NewsSection'
import Contact from './components/Contact'
import CosmicBackground, { type Scene } from './components/CosmicBackground'
import { profile } from './data/content'

export default function App() {
  const [scene, setScene] = useState<Scene | null>(null)
  const exitScene = useCallback(() => setScene(null), [])

  return (
    <>
      <CosmicBackground scene={scene} onExit={exitScene} />
      <Nav />
      <main>
        <Hero scene={scene} onSceneChange={setScene} />
        <Publications />
        <AwardsSection />
        <ExperienceSection />
        <EducationSection />
        <NewsSection />
        <Contact />
      </main>
      <footer>
        © {new Date().getFullYear()} {profile.name}
      </footer>
    </>
  )
}
