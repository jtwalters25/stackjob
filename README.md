# StackJob

Trade contractor job management app. Import messy desktop job folders via Claude AI → track jobs from lead to completion.

Works for any trade: Electrician, Plumber, HVAC, Roofing, General Contractor, Carpenter, Painter, Elevator, and more.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL editor and run the migration below
3. Copy your project URL and anon key from **Project Settings → API**

#### SQL Migration (run in Supabase SQL Editor)

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  building_name TEXT,
  address TEXT,
  job_type TEXT,
  trade TEXT DEFAULT 'General',
  stage TEXT DEFAULT 'Lead' CHECK (stage IN ('Lead', 'Site Visit', 'Proposal Sent', 'Won', 'Scheduled', 'In Progress', 'Complete')),
  has_prints BOOLEAN DEFAULT FALSE,
  has_proposal BOOLEAN DEFAULT FALSE,
  has_parts_list BOOLEAN DEFAULT FALSE,
  has_permit BOOLEAN DEFAULT FALSE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('print', 'proposal', 'photo', 'work_order', 'other')),
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT now()
);

CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trade TEXT DEFAULT 'General',
  company_name TEXT
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own jobs" ON jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own documents" ON documents
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM jobs WHERE id = job_id));

CREATE POLICY "Users can manage their own notes" ON voice_notes
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM jobs WHERE id = job_id));

CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

### 3. Get an Anthropic API key

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Test Workflow

### Create a sample folder structure on your desktop:

```
Desktop/
└── MyJobs/
    ├── Smith_Residence_Kitchen_Renovation/
    │   ├── kitchen_drawings.pdf
    │   ├── proposal_final.pdf
    │   └── site_visit_photo.jpg
    ├── Johnson_Building_HVAC_Repair/
    │   ├── work_order_2024.pdf
    │   └── repair_estimate.pdf
    ├── Downtown_Hotel_Electrical/
    │   ├── panel_upgrade_drawings.pdf
    │   └── bid_proposal.pdf
    ├── Riverside_Apartments_Plumbing/
    │   └── repipe_estimate.pdf
    └── Harbor_Office_Painting/
        ├── color_samples.pdf
        └── quote_v3.pdf
```

### Test the import:

1. Visit `/onboard`
2. Click "Select Folder" → choose the `MyJobs` folder
3. Wait ~20 seconds for Claude to parse
4. You should see "Found 5 jobs!" and be redirected to the home page
5. Jobs appear grouped by stage (all start as "Lead")

### Verify jobs created:

- All 5 folders should appear as separate jobs
- `has_prints: true` on jobs with "prints" or "drawings" files
- `has_proposal: true` on jobs with "proposal", "quote", or "bid" files
- Trade and job types auto-detected from folder/file names

---

## Core Features

| Feature | How |
|---------|-----|
| AI folder import | `/onboard` → select folder → Claude parses structure |
| Job list | Home page grouped by Active/Pending/Complete with search |
| Job detail | Stage dropdown, doc toggles, checklist, notes |
| Navigate | Fixed button → warns if missing prints/proposal → Google Maps |
| Manual entry | `/jobs/new` form |

## Stage Flow

```
Lead → Site Visit → Proposal Sent → Won → Scheduled → In Progress → Complete
```

Stage-specific checklists appear automatically on job detail.

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# ANTHROPIC_API_KEY
```

Or push to GitHub and import at [vercel.com/new](https://vercel.com/new) — add the 3 env vars and deploy.

Total deploy time: ~5 minutes.

---

## Project Structure

```
stackjob/
├── app/
│   ├── page.tsx              # Home: job list grouped by stage
│   ├── onboard/page.tsx      # Folder import via webkitdirectory
│   ├── jobs/[id]/page.tsx    # Job detail with stage/checklist/notes/nav
│   ├── jobs/new/page.tsx     # Manual job creation form
│   └── api/
│       ├── import/route.ts   # Claude folder parsing + DB insert
│       ├── jobs/route.ts     # GET all, POST create
│       ├── jobs/[id]/route.ts # GET, PATCH, DELETE single job
│       ├── documents/route.ts # POST document metadata
│       └── notes/route.ts    # POST voice/text note
├── components/
│   ├── JobCard.tsx           # Job list item with missing doc warning
│   ├── WarningModal.tsx      # Missing docs alert before navigation
│   └── StageSelect.tsx       # Stage dropdown with color coding
└── lib/
    ├── supabase.ts           # Client, types, constants
    └── claude.ts             # parseFolderStructure function
```
