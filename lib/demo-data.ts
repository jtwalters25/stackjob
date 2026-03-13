import { FileType, JobStage } from "./supabase";

interface DemoDocument {
  file_name: string;
  file_path: string;
  file_type: FileType;
}

interface DemoJob {
  customer_name: string;
  building_name: string;
  address: string;
  job_type: string;
  trade: string;
  stage: JobStage;
  has_prints: boolean;
  has_proposal: boolean;
  has_parts_list: boolean;
  has_permit: boolean;
  notes: string | null;
  documents: DemoDocument[];
}

export const DEMO_JOBS: DemoJob[] = [
  {
    customer_name: "Westfield Corp",
    building_name: "Westfield Tower",
    address: "350 N Orleans St, Chicago, IL 60654",
    job_type: "Modernization",
    trade: "Elevator",
    stage: "In Progress",
    has_prints: true,
    has_proposal: true,
    has_parts_list: true,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "westfield_elevator_prints_rev3.pdf", file_path: "Westfield_Tower_Modernization/prints/westfield_elevator_prints_rev3.pdf", file_type: "print" },
      { file_name: "proposal_westfield_v2.pdf", file_path: "Westfield_Tower_Modernization/proposal_westfield_v2.pdf", file_type: "proposal" },
    ],
  },
  {
    customer_name: "Harbor Medical",
    building_name: "Harbor Medical Center",
    address: "2900 W Harrison St, Chicago, IL 60612",
    job_type: "Panel Upgrade",
    trade: "Electrician",
    stage: "Scheduled",
    has_prints: false,
    has_proposal: true,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "harbor_panel_quote.pdf", file_path: "Harbor_Medical_PanelUpgrade/harbor_panel_quote.pdf", file_type: "proposal" },
      { file_name: "existing_panel_photos.jpg", file_path: "Harbor_Medical_PanelUpgrade/photos/existing_panel_photos.jpg", file_type: "photo" },
    ],
  },
  {
    customer_name: "City of Chicago",
    building_name: "City Hall",
    address: "121 N LaSalle St, Chicago, IL 60602",
    job_type: "Tenant Improvement",
    trade: "General Contractor",
    stage: "In Progress",
    has_prints: true,
    has_proposal: true,
    has_parts_list: true,
    has_permit: true,
    notes: null,
    documents: [
      { file_name: "cityhall_construction_drawings.pdf", file_path: "CityHall_TI/drawings/cityhall_construction_drawings.pdf", file_type: "print" },
      { file_name: "gc_proposal_final.pdf", file_path: "CityHall_TI/gc_proposal_final.pdf", file_type: "proposal" },
      { file_name: "building_permit_001.pdf", file_path: "CityHall_TI/permits/building_permit_001.pdf", file_type: "work_order" },
    ],
  },
  {
    customer_name: "Riverside Properties",
    building_name: "Riverside Apartments",
    address: "1 E Wacker Dr, Chicago, IL 60601",
    job_type: "Repipe",
    trade: "Plumber",
    stage: "Proposal Sent",
    has_prints: false,
    has_proposal: true,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "riverside_repipe_estimate.pdf", file_path: "Riverside_Repipe/riverside_repipe_estimate.pdf", file_type: "proposal" },
    ],
  },
  {
    customer_name: "TechHub Inc",
    building_name: "TechHub Campus Bldg A",
    address: "600 W Chicago Ave, Chicago, IL 60654",
    job_type: "New Installation",
    trade: "HVAC",
    stage: "Scheduled",
    has_prints: true,
    has_proposal: true,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "techhub_hvac_drawings.pdf", file_path: "TechHub_HVAC/techhub_hvac_drawings.pdf", file_type: "print" },
      { file_name: "hvac_install_proposal.pdf", file_path: "TechHub_HVAC/hvac_install_proposal.pdf", file_type: "proposal" },
    ],
  },
  {
    customer_name: "Grand Hotel Group",
    building_name: "The Grand Chicago",
    address: "500 N Michigan Ave, Chicago, IL 60611",
    job_type: "Replacement",
    trade: "Roofing",
    stage: "Lead",
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [],
  },
  {
    customer_name: "Lincoln Properties",
    building_name: "Lincoln Center Office",
    address: "180 N LaSalle St, Chicago, IL 60601",
    job_type: "Finish Carpentry",
    trade: "Carpenter",
    stage: "Won",
    has_prints: false,
    has_proposal: true,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "lincoln_carpentry_bid.pdf", file_path: "Lincoln_Carpentry/lincoln_carpentry_bid.pdf", file_type: "proposal" },
    ],
  },
  {
    customer_name: "Lakeside Development",
    building_name: "Lakeside Office Park",
    address: "400 E Randolph St, Chicago, IL 60601",
    job_type: "Elevator Install",
    trade: "Elevator",
    stage: "Site Visit",
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [],
  },
  {
    customer_name: "O'Hare Concessions",
    building_name: "Airport Terminal B",
    address: "10000 W O'Hare Ave, Chicago, IL 60666",
    job_type: "Commercial",
    trade: "Painter",
    stage: "Complete",
    has_prints: false,
    has_proposal: true,
    has_parts_list: true,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "ohare_paint_proposal.pdf", file_path: "Airport_TerminalB_Paint/ohare_paint_proposal.pdf", file_type: "proposal" },
      { file_name: "completion_signoff.pdf", file_path: "Airport_TerminalB_Paint/completion_signoff.pdf", file_type: "work_order" },
    ],
  },
  {
    customer_name: "Metro Plaza LLC",
    building_name: "Metro Plaza",
    address: "225 W Randolph St, Chicago, IL 60606",
    job_type: "Repair",
    trade: "Electrician",
    stage: "In Progress",
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    has_permit: false,
    notes: null,
    documents: [
      { file_name: "metro_electrical_work_order.pdf", file_path: "Metro_Plaza_Electrical/metro_electrical_work_order.pdf", file_type: "work_order" },
    ],
  },
];
