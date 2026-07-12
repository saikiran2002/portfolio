import Nav from './components/Nav'
import Hero from './components/Hero'
import Publications from './components/Publications'
import ExperienceSection from './components/ExperienceSection'
import EducationSection from './components/EducationSection'
import NewsSection from './components/NewsSection'
import Contact from './components/Contact'
import { profile } from './data/content'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Publications />
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
