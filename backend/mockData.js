const rawMockNews = {
  general: [
    {
      title: "Global Climate Summit Produces Historic 35-Nation Carbon Pact",
      description: "Leaders from over 35 nations gather to commit to aggressive new timeline targets for carbon neutral grids by 2035, marking a pivotal moment in international environmental cooperation.",
      url: "https://www.reuters.com/sustainability/climate-energy-pact-2026",
      urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
      publishedAt: "2026-08-03T08:00:00Z",
      source: { name: "Reuters" },
      author: "Sarah Jenkins"
    },
    {
      title: "Urban Reforestation Projects Transforming Major Cities Worldwide",
      description: "How metropolitan areas are converting abandoned highways and concrete spaces into thriving mini-forests, reshaping urban landscapes for future generations.",
      url: "https://www.theguardian.com/environment/urban-forests-2026",
      urlToImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800",
      publishedAt: "2026-07-15T14:30:00Z",
      source: { name: "The Guardian" },
      author: "David Chen"
    },
    {
      title: "Tech Layoffs Continue as Silicon Valley Firms Restructure for AI Era",
      description: "Major technology companies including several Fortune 500 firms announced workforce adjustments, citing a strategic shift towards AI-driven automation.",
      url: "https://www.bbc.com/news/technology/workforce-restructure-2026",
      urlToImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800",
      publishedAt: "2026-08-01T10:15:00Z",
      source: { name: "BBC News" },
      author: "Marcus Vance"
    },
    {
      title: "Historic Peace Agreement Signed After Decade-Long Negotiations",
      description: "Two nations formally end hostilities with a comprehensive peace framework that includes economic cooperation and demilitarized border zones.",
      url: "https://www.un.org/news/peace-pact-2026",
      urlToImage: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=800",
      publishedAt: "2026-06-10T09:00:00Z",
      source: { name: "UN News" },
      author: "Priya Kapoor"
    },
    {
      title: "Ocean Cleanup Initiative Removes One Million Tons of Plastic",
      description: "The ambitious environmental project reaches a major milestone after five years of continuous operation across the Pacific and Atlantic oceans.",
      url: "https://theoceancleanup.com/milestone-one-million-tons",
      urlToImage: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?q=80&w=800",
      publishedAt: "2026-05-05T12:00:00Z",
      source: { name: "EcoWatch" },
      author: "Marina Costa"
    },
    {
      title: "Space Exploration Agency Announces Crewed Mars Mission for 2029",
      description: "In a landmark announcement, the space consortium confirmed a six-person crew will embark on the first crewed mission to Mars.",
      url: "https://www.nasa.gov/news/mars-crewed-mission-2029",
      urlToImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800",
      publishedAt: "2026-08-02T06:00:00Z",
      source: { name: "NASA" },
      author: "Dr. Neil Adams"
    },
    {
      title: "Artificial Intelligence Transforms Newsroom Operations Worldwide",
      description: "Media organizations are rapidly adopting artificial intelligence tools to automate routine reporting tasks and fact-check in real time.",
      url: "https://www.theguardian.com/technology/ai-newsrooms-2026",
      urlToImage: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=800",
      publishedAt: "2026-07-28T11:00:00Z",
      source: { name: "The Guardian" },
      author: "Alicia Park"
    },
    {
      title: "Renewable Solar Infrastructure Reaches Grid Parity in 50 Countries",
      description: "Solar and wind energy installations now cost less than coal and natural gas generation across five continents.",
      url: "https://www.bloomberg.com/green/solar-grid-parity-2026",
      urlToImage: "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=800",
      publishedAt: "2026-07-20T14:20:00Z",
      source: { name: "Bloomberg" },
      author: "Harrison Forde"
    },
    {
      title: "High-Speed Maglev Rail Network Connects European Capitals",
      description: "Travelers can now journey from Paris to Berlin in under three hours following the opening of the transnational maglev corridor.",
      url: "https://www.euronews.com/next/maglev-rail-europe-2026",
      urlToImage: "https://images.unsplash.com/photo-1515165562839-978bbcf18277?q=80&w=800",
      publishedAt: "2026-07-11T16:45:00Z",
      source: { name: "EuroNews" },
      author: "Claire Dupont"
    },
    {
      title: "Global Literacy Rate Reaches All-Time High of 91 Percent",
      description: "UNESCO reports historic educational breakthroughs in developing regions, powered by accessible digital learning tools.",
      url: "https://en.unesco.org/news/global-literacy-milestone-2026",
      urlToImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800",
      publishedAt: "2026-06-30T10:00:00Z",
      source: { name: "UNESCO" },
      author: "Amara Diallo"
    },
    {
      title: "Wild Coral Reef Restoration Breakthrough Restores Great Barrier Section",
      description: "Marine biologists successfully deploy heat-resistant coral larvae to rehabilitate bleached reef ecosystems in Australia.",
      url: "https://www.nationalgeographic.com/environment/coral-restoration-2026",
      urlToImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800",
      publishedAt: "2026-06-18T13:10:00Z",
      source: { name: "National Geographic" },
      author: "Liam O'Connor"
    },
    {
      title: "Autonomous Electric Cargo Ferries Launched in Scandinavian Fjords",
      description: "Zero-emission self-navigating ferries begin commercial operation, reducing regional coastal freight carbon emissions.",
      url: "https://www.maritime-executive.com/electric-ferries-scandinavia-2026",
      urlToImage: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=800",
      publishedAt: "2026-06-05T08:30:00Z",
      source: { name: "Maritime Executive" },
      author: "Soren Larsen"
    }
  ],
  technology: [
    {
      title: "Artificial Intelligence Breakthrough Enables Real-Time Language Translation at Human Parity",
      description: "A new multimodal AI model achieves near-perfect simultaneous translation across 120 languages in global communication.",
      url: "https://www.wired.com/story/ai-realtime-translation-2026",
      urlToImage: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=800",
      publishedAt: "2026-08-03T10:00:00Z",
      source: { name: "Wired" },
      author: "Elena Rostova"
    },
    {
      title: "Tech Sector Restructuring dislocates 50,000 Roles as Automation Accelerates",
      description: "The second wave of technology sector workforce shifts displaced workers across software engineering and data management.",
      url: "https://techcrunch.com/2026/08/tech-sector-restructuring",
      urlToImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800",
      publishedAt: "2026-08-01T09:30:00Z",
      source: { name: "TechCrunch" },
      author: "Brian O'Conner"
    },
    {
      title: "Quantum Computing Hits Commercial Milestone with 1,000-Qubit Processor",
      description: "IBM and Google jointly announce a stable 1,000-qubit processor maintaining coherence for practical drug discovery simulations.",
      url: "https://news.ycombinator.com/item?id=quantum-1000-qubit",
      urlToImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800",
      publishedAt: "2026-07-20T09:20:00Z",
      source: { name: "Hacker News" },
      author: "Aria Sterling"
    },
    {
      title: "Next-Generation Chip Architecture Doubles AI Processing Power",
      description: "A breakthrough in 3D transistor stacking allows chip manufacturers to double AI computing efficiency on silicon.",
      url: "https://www.anandtech.com/show/next-gen-chip-architecture-2026",
      urlToImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800",
      publishedAt: "2026-06-22T15:30:00Z",
      source: { name: "AnandTech" },
      author: "James Liu"
    },
    {
      title: "Open-Source AI Model Reaches 100 Million Downloads on Hugging Face",
      description: "An open-source large language model released by a university consortium becomes the fastest downloaded model in AI history.",
      url: "https://huggingface.co/blog/100m-downloads-milestone",
      urlToImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800",
      publishedAt: "2026-05-14T11:00:00Z",
      source: { name: "Hugging Face Blog" },
      author: "Sarah Nguyen"
    },
    {
      title: "Space Tech Ventures Raise $12 Billion in Record Funding Quarter",
      description: "Private satellite internet and lunar exploration ventures attracted unprecedented venture capital investment.",
      url: "https://techcrunch.com/startups/space-tech-funding-2026",
      urlToImage: "https://images.unsplash.com/photo-1457364887197-9150188c107b?q=80&w=800",
      publishedAt: "2026-04-10T14:00:00Z",
      source: { name: "TechCrunch" },
      author: "Priya Singh"
    },
    {
      title: "Solid-State Battery Breakthrough Extends EV Range to 800 Miles",
      description: "Automakers confirm pilot production of non-flammable solid-state batteries charging to 80% in under eight minutes.",
      url: "https://www.autoblog.com/ev-solid-state-battery-breakthrough-2026",
      urlToImage: "https://images.unsplash.com/photo-1558441719-677975414d7a?q=80&w=800",
      publishedAt: "2026-07-29T17:15:00Z",
      source: { name: "AutoBlog" },
      author: "Marcus Thorne"
    },
    {
      title: "Cybersecurity Alliance Neutralizes Global Botnet Spanning 5 Million Devices",
      description: "International law enforcement agencies coordinated with tech firms to dismantle a major infrastructure threat.",
      url: "https://www.darkreading.com/threat-intelligence/botnet-takedown-2026",
      urlToImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800",
      publishedAt: "2026-07-08T12:40:00Z",
      source: { name: "Dark Reading" },
      author: "Samantha Bell"
    },
    {
      title: "WebAssembly 3.0 Standard Standardizes Native Browser Computing",
      description: "W3C ratifies WebAssembly 3.0 specifications, bringing multithreaded desktop application performance to browser windows.",
      url: "https://www.infoworld.com/article/webassembly-3-standardized-2026",
      urlToImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800",
      publishedAt: "2026-06-15T09:00:00Z",
      source: { name: "InfoWorld" },
      author: "Vikram Patel"
    }
  ],
  business: [
    {
      title: "Federal Reserve Trims Interest Rates by 25 Basis Points Amid Easing Inflation",
      description: "Central bank officials unanimously voted to lower benchmark borrowing costs, signaling confidence in economic stability.",
      url: "https://www.wsj.com/economy/central-banks/fed-rate-cut-2026",
      urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800",
      publishedAt: "2026-08-02T18:00:00Z",
      source: { name: "Wall Street Journal" },
      author: "Robert Miller"
    },
    {
      title: "Global E-Commerce Revenue Exceeds $7 Trillion in Benchmark Year",
      description: "Digital retail sales reached unprecedented highs driven by mobile commerce and integrated social media storefronts.",
      url: "https://www.bloomberg.com/news/articles/ecommerce-7-trillion-milestone-2026",
      urlToImage: "https://images.unsplash.com/photo-1556742049-0a67daf64f22?q=80&w=800",
      publishedAt: "2026-07-25T11:45:00Z",
      source: { name: "Bloomberg" },
      author: "Katherine Zhao"
    },
    {
      title: "Green Energy Investment Surpasses Fossil Fuel Expenditures Globally",
      description: "For the first time in financial history, capital allocations toward renewable power infrastructure surpassed oil and gas exploration.",
      url: "https://www.ft.com/content/green-energy-investment-record-2026",
      urlToImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=800",
      publishedAt: "2026-06-30T14:10:00Z",
      source: { name: "Financial Times" },
      author: "Jonathan Hayes"
    },
    {
      title: "Global Supply Chain Resilience Index Rises Following Diversification",
      description: "Multinational corporations report reduced disruption delays after shifting manufacturing operations closer to end markets.",
      url: "https://www.reuters.com/business/supply-chain-resilience-index-2026",
      urlToImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800",
      publishedAt: "2026-07-18T10:30:00Z",
      source: { name: "Reuters" },
      author: "Helena Schmidt"
    },
    {
      title: "Venture Capital Activity Bounces Back with Focus on Clean Technology",
      description: "Private equity firms invested $45 billion into carbon capture, grid storage, and sustainable agriculture startups.",
      url: "https://techcrunch.com/business/vc-cleantech-rebound-2026",
      urlToImage: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=800",
      publishedAt: "2026-07-04T16:20:00Z",
      source: { name: "TechCrunch" },
      author: "Derrick Rose"
    }
  ],
  sports: [
    {
      title: "World Cup 2026 Qualification Round Concludes with Surprising Upset Winners",
      description: "Underdog national teams secured historic tournament spots following tense penalty shootout victories in final qualifier matches.",
      url: "https://www.espn.com/soccer/story/_/id/world-cup-qualifiers-2026",
      urlToImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800",
      publishedAt: "2026-08-03T21:00:00Z",
      source: { name: "ESPN" },
      author: "Carlos Gutierrez"
    },
    {
      title: "Olympic Committee Approves 4 New Urban Sports for 2028 Summer Games",
      description: "Parkour, coastal rowing, trail running, and obstacle course racing officially join the Olympic medal program.",
      url: "https://www.olympics.com/news/new-urban-sports-approved-2028",
      urlToImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800",
      publishedAt: "2026-07-21T15:40:00Z",
      source: { name: "IOC News" },
      author: "Sophie Martin"
    },
    {
      title: "Marathon World Record Shattered Under Sub-Two-Hour Limit in Berlin",
      description: "Elite distance runner completes the 26.2-mile course in 1:58:42, setting a new official world athletic standard.",
      url: "https://www.bbc.com/sport/athletics/berlin-marathon-world-record-2026",
      urlToImage: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=800",
      publishedAt: "2026-06-28T11:15:00Z",
      source: { name: "BBC Sport" },
      author: "Kipchoge Ndiaye"
    },
    {
      title: "Tennis Grand Slam Championship Ends in Five-Set Thriller",
      description: "A four-hour battle on center court concluded with a dramatic tiebreaker victory for the 21-year-old challenger.",
      url: "https://www.tennis.com/news/grand-slam-five-set-thriller-2026",
      urlToImage: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800",
      publishedAt: "2026-07-12T19:00:00Z",
      source: { name: "Tennis Magazine" },
      author: "Arthur Ashe Jr."
    }
  ],
  entertainment: [
    {
      title: "Sci-Fi Epic Sweeps International Film Festival Winning 7 Major Awards",
      description: "Critically acclaimed space opera film earned top honors for cinematography, visual effects, and original score.",
      url: "https://variety.com/film/awards/festival-sweep-scifi-epic-2026",
      urlToImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800",
      publishedAt: "2026-08-01T20:30:00Z",
      source: { name: "Variety" },
      author: "Rebecca Stone"
    },
    {
      title: "Global Music Streaming Hits 1 Billion Active Paid Subscribers",
      description: "Digital audio platforms record historic growth led by expanding markets across Latin America and Southeast Asia.",
      url: "https://www.billboard.com/business/tech/music-streaming-billion-subscribers-2026",
      urlToImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800",
      publishedAt: "2026-07-19T13:25:00Z",
      source: { name: "Billboard" },
      author: "Tariq Jones"
    },
    {
      title: "Indie Video Game Developed by Studio of Three Sells 5 Million Copies",
      description: "An evocative pixel-art adventure game tops digital bestseller charts worldwide within two weeks of launch.",
      url: "https://www.ign.com/articles/indie-game-smash-hit-5m-sales-2026",
      urlToImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800",
      publishedAt: "2026-07-02T17:50:00Z",
      source: { name: "IGN" },
      author: "Alex Mercer"
    }
  ],
  health: [
    {
      title: "Universal Flu Vaccine Enters Phase III Clinical Trials with High Efficacy",
      description: "Medical researchers report promising immune response results for single-dose vaccine providing multi-strain protection.",
      url: "https://www.lancet.com/journals/lancet/article/universal-flu-vaccine-phase3-2026",
      urlToImage: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800",
      publishedAt: "2026-08-02T07:15:00Z",
      source: { name: "The Lancet" },
      author: "Dr. Aris Thorne"
    },
    {
      title: "CRISPR Gene Therapy Receives Approval for Inherited Blood Disorders",
      description: "Health regulatory agencies authorize targeted gene-editing treatment providing curative outcomes for patients.",
      url: "https://www.nature.com/articles/crispr-blood-disorders-approval-2026",
      urlToImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800",
      publishedAt: "2026-07-14T12:00:00Z",
      source: { name: "Nature Medicine" },
      author: "Dr. Maya Lin"
    },
    {
      title: "Daily 20-Minute Brisk Walk Associated with 30% Lower Cardiovascular Risk",
      description: "Longitudinal health study of 100,000 participants confirms significant longevity benefits from accessible daily movement.",
      url: "https://www.bmj.com/content/brisk-walking-cardiovascular-health-2026",
      urlToImage: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800",
      publishedAt: "2026-06-25T09:45:00Z",
      source: { name: "BMJ" },
      author: "Dr. Julian Vance"
    }
  ],
  science: [
    {
      title: "James Webb Space Telescope Captures Atmosphere Spectrum of Earth-Sized Exoplanet",
      description: "Spectroscopic data confirms presence of water vapor and carbon dioxide in habitable zone system 40 light-years away.",
      url: "https://www.nasa.gov/mission_pages/webb/exoplanet-atmosphere-2026",
      urlToImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
      publishedAt: "2026-08-01T15:00:00Z",
      source: { name: "NASA JPL" },
      author: "Dr. Samantha Reed"
    },
    {
      title: "Nuclear Fusion Test Reactor Achieves Net Energy Gain for 100 Continuous Seconds",
      description: "Experimental tokamak facility sets a new plasma confinement duration record, paving the way for commercial fusion energy.",
      url: "https://www.nature.com/articles/fusion-100s-net-gain-2026",
      urlToImage: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=800",
      publishedAt: "2026-07-16T18:30:00Z",
      source: { name: "Nature Physics" },
      author: "Dr. Henrik Weiss"
    },
    {
      title: "Deep-Sea Expedition Discovers 200 Previously Unknown Species in Pacific Trench",
      description: "Robotic submersibles exploring depths of 6,000 meters capture footage and biological samples of bioluminescent fauna.",
      url: "https://www.sciencedaily.com/releases/deepsea-trench-species-2026",
      urlToImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800",
      publishedAt: "2026-06-12T14:10:00Z",
      source: { name: "Science Daily" },
      author: "Dr. Elena Vasquez"
    }
  ],
  food: [
    {
      title: "Mediterranean Diet Crowned Top Overall Eating Plan for Longevity",
      description: "Health experts and nutritionists reaffirm plant-heavy eating styles for cognitive resilience and heart health.",
      url: "https://www.foodandwine.com/mediterranean-diet-top-rank-2026",
      urlToImage: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800",
      publishedAt: "2026-08-05T11:00:00Z",
      source: { name: "Food & Wine" },
      author: "Elena Rostova"
    },
    {
      title: "Global Plant-Based Gourmet Revolution Expands to Michelin Restaurants",
      description: "Renowned chefs worldwide are shifting towards fully plant-based tasting menus driven by sustainable culinary demand.",
      url: "https://www.eater.com/michelin-plant-based-gourmet-2026",
      urlToImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800",
      publishedAt: "2026-08-04T09:30:00Z",
      source: { name: "Eater" },
      author: "Chef Marco Pierre"
    }
  ]
};

// Apply realistic staggered publication timestamps across all articles (e.g. 18m ago, 2h ago, 5h ago)
const applyStaggeredTimestamps = (data) => {
  const now = Date.now();
  const processed = {};
  Object.keys(data).forEach((cat) => {
    processed[cat] = data[cat].map((art, idx) => ({
      ...art,
      publishedAt: new Date(now - (idx * 2.5 + 0.3) * 3600000).toISOString()
    }));
  });
  return processed;
};

export const mockNews = applyStaggeredTimestamps(rawMockNews);
