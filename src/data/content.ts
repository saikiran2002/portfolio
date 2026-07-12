export interface Publication {
  title: string
  authors: string
  venue: string
  year: number
  doi?: string
  note?: string
}

export interface Experience {
  role: string
  org: string
  dates: string
  location?: string
  bullets: { text: string; link?: { label: string; url: string } }[]
  current?: boolean
}

export interface Education {
  degree: string
  school: string
  years: string
  gpaLabel: string
  gpaValue: string
  detail: string
  detailLink?: { label: string; url: string }
}

export interface NewsMedia {
  label: string
  url: string
  type: 'photo' | 'video'
}

export interface NewsItem {
  date: string
  year: number
  text: string
  media?: NewsMedia[]
}

export const profile = {
  name: 'Naga Datha Saikiran Battula',
  pronouns: '(He/Him)',
  role: 'PhD Student, NJIT',
  advisor: {
    name: 'Dr. Aritra Dasgupta',
    url: 'https://aedeegee.github.io/',
  },
  photo: 'Profile.jpeg',
  cv: 'saikiran-resume.pdf',
  about: [
    "I am a PhD student in Data Science at the New Jersey Institute of Technology, working in NJIT's Intelligible Information Visualization (NiiV) lab under Dr. Aritra Dasgupta. I am an aspiring researcher with a strong background in Natural Language Processing, LLM architectures, and data science fundamentals.",
    'My work focuses on developing and deploying innovative, data-driven solutions that enhance the use of conversational AI in real-time, dynamic systems — including a Human-AI conversational interface for real-time safeguarding of power grids and multimodal attribute-extraction pipelines for question-answering in science domains.',
  ],
  socials: [
    { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', url: 'https://www.linkedin.com/in/naga-datha-saikiran-battula-a62749206/' },
    { label: 'GitHub', icon: 'fa-brands fa-github', url: 'https://github.com/saikiran2002' },
    { label: 'Google Scholar', icon: 'fa-solid fa-graduation-cap', url: 'https://scholar.google.com/citations?user=APls0i4AAAAJ' },
    { label: 'ORCID', icon: 'fa-brands fa-orcid', url: 'https://orcid.org/0009-0003-7656-0194' },
  ],
  interests: [
    'Large Language Models',
    'Computer Vision',
    'Data Visualization',
    'AI Ethics',
    'Reinforcement Learning',
    'Space Exploration',
    'Black Hole Theory',
  ],
  contact: {
    emails: ['nb547@njit.edu', 'battulasaikiran2002@gmail.com'],
    location: 'New Jersey, USA',
    formspreeId: 'YOUR_FORM_ID', // replace with your Formspree form ID
  },
}

export const publications: Publication[] = [
  {
    title:
      'Divide and Concur: Design Study of a Multimodal, Real-Time Human-AI Collaboration Framework for Safeguarding Power Grids',
    authors:
      'N. D. S. Battula, C. Fitzpatrick, S. A. R. Naqvi, T. Yin, S. P. Nandanoori, K. Bhattacharjee, S. Kundu, A. Dasgupta',
    venue: 'EuroVis',
    year: 2026,
    note: 'Submitted',
  },
  {
    title:
      'Deep-Learning Residual Network Based Image Analysis for an Efficient Two-Stage Recognition of Neurological Disorders',
    authors: 'N. D. S. Battula, H. R. Kambhampaty, Y. Vijayalata, R. N. Ashlin Deepa',
    venue: '2nd International Conference for Innovation in Technology (INOCON)',
    year: 2023,
    doi: 'https://doi.org/10.1109/INOCON57975.2023.10101037',
  },
  {
    title: 'Network Optimization of Large-Scale CNNs for Applications in Autonomous Machines',
    authors: 'H. R. Kambhampaty, N. D. S. Battula, S. Rentala, S. C. Challa, A. K.',
    venue: '2nd International Conference for Innovation in Technology (INOCON)',
    year: 2023,
    doi: 'https://doi.org/10.1109/INOCON57975.2023.10101330',
  },
  {
    title: "A Novel Deep-Learning Based Classification of Alzheimer's Disease in Adults",
    authors: 'H. R. Kambhampaty, N. D. S. Battula, Y. Vijayalata, A. D. R. N.',
    venue: 'IEEE Delhi Section Conference (DELCON)',
    year: 2022,
    doi: 'https://doi.org/10.1109/DELCON54057.2022.9752991',
  },
]

export const experiences: Experience[] = [
  {
    role: 'Doctoral Researcher',
    org: "New Jersey Institute of Technology",
    dates: 'Jan 2025 – Present',
    location: 'Newark, NJ',
    current: true,
    bullets: [
      { text: 'Developed an interactive Human-AI conversational interface for real-time safeguarding of power grids.' },
      { text: 'Implemented an attribute-extraction pipeline for multimodal data (text and images) analysis and question-answering in science domains.' },
    ],
  },
  {
    role: 'Graduate Research Assistant',
    org: "NJIT's Intelligible Information Visualization (NiiV) Lab",
    dates: 'Feb 2024 – Dec 2024',
    location: 'Newark, NJ',
    bullets: [
      { text: 'Worked on validation of model-based simulations of the Weather Research & Forecast (WRF) Model by steering with different climate-science-based physics parameters.' },
    ],
  },
  {
    role: "Master's Student",
    org: 'New Jersey Institute of Technology',
    dates: 'Sep 2023 – Dec 2024',
    location: 'Newark, NJ',
    bullets: [
      {
        text: 'MS Thesis:',
        link: {
          label: 'Surveying the role of visual analytics in human-machine teaming',
          url: 'https://digitalcommons.njit.edu/theses/2946/',
        },
      },
    ],
  },
]

export const education: Education[] = [
  {
    degree: 'Ph.D. in Data Science',
    school: 'New Jersey Institute of Technology',
    years: 'Jan 2025 – Present',
    gpaLabel: 'In',
    gpaValue: 'Progress',
    detail: 'Research in Human-AI collaboration, NLP, and intelligible information visualization at the NiiV lab.',
  },
  {
    degree: 'M.S. in Data Science',
    school: 'New Jersey Institute of Technology',
    years: 'Sep 2023 – Dec 2024',
    gpaLabel: 'GPA',
    gpaValue: '3.91 / 4.0',
    detail: 'Thesis:',
    detailLink: {
      label: 'Surveying the role of visual analytics in human-machine teaming',
      url: 'https://digitalcommons.njit.edu/theses/2946/',
    },
  },
  {
    degree: 'B.Tech in Computer Science and Engineering',
    school: 'Gokaraju Rangaraju Institute of Engineering and Technology',
    years: 'Aug 2019 – May 2023',
    gpaLabel: 'GPA',
    gpaValue: '9.53 / 10',
    detail: 'Published three IEEE conference papers on deep learning during undergraduate studies.',
  },
]

export const news: NewsItem[] = [
  {
    date: '2026',
    year: 2026,
    text: 'AI Exploration Day: A student research showcase at NJIT, where I presented my work on Human-AI collaboration for safeguarding power grids.',
    media: [
      { label: 'Photo 1', url: 'AI_exploration_1.jpeg', type: 'photo' },
      { label: 'Photo 2', url: 'AI_exploration_2.jpeg', type: 'photo' },
    ],
  },
  {
    date: '2026',
    year: 2026,
    text: 'Submitted "Divide and Concur" — a multimodal, real-time Human-AI collaboration framework for safeguarding power grids — to EuroVis 2026.',
  },
  {
    date: 'Nov 2025',
    year: 2025,
    text: 'Siemens company visit related to Human-AI collaboration for safeguarding power grids, which is one of research collaboration with PNNL (Pacific Northwest National Laboratory)',
  },
  {
    date: 'Jan 2025',
    year: 2025,
    text: "Started my Ph.D. in Data Science at NJIT, continuing at the NiiV lab with Dr. Aritra Dasgupta.",
  },
  {
    date: 'Dec 2024',
    year: 2024,
    text: 'Graduated with an M.S. in Data Science from NJIT (GPA 3.91/4.0)',
    media: [
      { label: 'Photo', url: 'MS_Graduate.jpeg', type: 'photo' },
      { label: 'Video', url: 'MS_Graduate_video.mp4', type: 'video' },
    ],
  },
  {
    date: 'Dec 2024',
    year: 2024,
    text: 'Successfully defended my M.S. thesis titled "Surveying the role of visual analytics in human-machine teaming" at NJIT.',
    media: [{ label: 'Photo', url: 'MS_thesis.jpeg', type: 'photo' }],
  },
  {
    date: 'Feb 2024',
    year: 2024,
    text: "Joined NJIT's NiiV lab as a Graduate Research Assistant.",
  },
]
