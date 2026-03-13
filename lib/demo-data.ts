import { FileType, JobStage, JobType } from "./supabase";

interface DemoDocument {
  file_name: string;
  file_path: string;
  file_type: FileType;
}

interface DemoJob {
  customer_name: string;
  building_name: string;
  address: string;
  job_type: JobType;
  stage: JobStage;
  has_prints: boolean;
  has_proposal: boolean;
  has_parts_list: boolean;
  notes: string | null;
  documents: DemoDocument[];
}

export const DEMO_JOBS: DemoJob[] = [
  {
    customer_name: "Westfield Corp",
    building_name: "Westfield Tower",
    address: "350 N Orleans St, Chicago, IL 60654",
    job_type: "Modernization",
    stage: "In Progress",
    has_prints: true,
    has_proposal: true,
    has_parts_list: true,
    notes: null,
    documents: [
      { file_name: "westfield_elevator_prints_rev3.pdf", file_path: "Westfield_Tower_Modernization/prints/westfield_elevator_prints_rev3.pdf", file_type: "print" },
      { file_name: "proposal_westfield_v2.pdf", file_path: "Westfield_Tower_Modernization/proposal_westfield_v2.pdf", file_type: "proposal" },
      { file_name: "parts_list_motor_controller.pdf", file_path: "Westfield_Tower_Modernization/parts_list_motor_controller.pdf", file_type: "other" },
    ],
  },
  {
    customer_name: "Harbor Medical",
    building_name: "Harbor Medical Center",
    address: "2900 W Harrison St, Chicago, IL 60612",
    job_type: "Repair",
    stage: "Scheduled",
    has_prints: false,
    has_proposal: true,
    has_parts_list: false,
    notes: null,
    documents: [
      { file_name: "harbor_repair_quote.pdf", file_path: "Harbor_Medical_Repair/harbor_repair_quote.pdf", file_type: "proposal" },
      { file_name: "site_visit_photos_1.jpg", file_path: "Harbor_Medical_Repair/photos/site_visit_photos_1.jpg", file_type: "photo" },
    ],
  },
  {
    customer_name: "City of Chicago",
    building_name: "City Hall",
    address: "121 N LaSalle St, Chicago, IL 60602",
    job_type: "Install",
    stage: "In Progress",
    has_prints: true,
    has_proposal: true,
    has_parts_list: true,
    notes: null,
    documents: [
      { file_name: "cityhall_elevator_blueprints.dwg", file_path: "CityHall_Install/blueprints/cityhall_elevator_blueprints.dwg", file_type: "print" },
      { file_name: "install_proposal_final.pdf", file_path: "CityHall_Install/install_proposal_final.pdf", file_type: "proposal" },
      { file_name: "work_order_001.pdf", file_path: "CityHall_Install/work_order_001.pdf", file_type: "work_order" },
    ],
  },
  {
    customer_name: "Riverside Properties",
    building_name: "Riverside Apartments",
    address: "1 E Wacker Dr, Chicago, IL 60601",
    job_type: "Modernization",
    stage: "Proposal Sent",
    has_prints: false,
    has_proposal: true,
    has_parts_list: false,
    notes: null,
    documents: [
      { file_name: "riverside_mod_estimate_v3.pdf", file_path: "Riverside_Apartments_Modernization/riverside_mod_estimate_v3.pdf", file_type: "proposal" },
    ],
  },
  {
    customer_name: "TechHub Inc",
    building_name: "TechHub Campus Bldg A",
    address: "600 W Chicago Ave, Chicago, IL 60654",
    job_type: "Maintenance",
    stage: "Scheduled",
    has_prints: true,
    has_proposal: true,
    has_parts_list: false,
    notes: null,
    documents: [
      { file_name: "techhub_pm_contract_2024.pdf", file_path: "TechHub_Maintenance/techhub_pm_contract_2024.pdf", file_type: "proposal" },
      { file_name: "elevator_drawings_techhub.pdf", file_path: "TechHub_Maintenance/elevator_drawings_techhub.pdf", file_type: "print" },
    ],
  },
  {
    customer_name: "Grand Hotel Group",
    building_name: "The Grand Chicago",
    address: "500 N Michigan Ave, Chicago, IL 60611",
    job_type: "Repair",
    stage: "Lead",
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    notes: null,
    documents: [],
  },
  {
    customer_name: "Lincoln Properties",
    building_name: "Lincoln Center Office",
    address: "180 N LaSalle St, Chicago, IL 60601",
    job_type: "Modernization",
    stage: "Won",
    has_prints: false,
    has_proposal: true,
    has_parts_list: false,
    notes: null,
    documents: [
      { file_name: "lincoln_center_winning_bid.pdf", file_path: "Lincoln_Center_Modernization/lincoln_center_winning_bid.pdf", file_type: "proposal" },
    ],
  },
  {
    customer_name: "Lakeside Development",
    building_name: "Lakeside Office Park",
    address: "400 E Randolph St, Chicago, IL 60601",
    job_type: "Install",
    stage: "Site Visit",
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    notes: null,
    documents: [],
  },
  {
    customer_name: "O'Hare Concessions",
    building_name: "Airport Terminal B",
    address: "10000 W O'Hare Ave, Chicago, IL 60666",
    job_type: "Modernization",
    stage: "Complete",
    has_prints: true,
    has_proposal: true,
    has_parts_list: true,
    notes: null,
    documents: [
      { file_name: "terminal_b_prints_final.pdf", file_path: "Airport_TerminalB_Modernization/prints/terminal_b_prints_final.pdf", file_type: "print" },
      { file_name: "ohare_modernization_proposal.pdf", file_path: "Airport_TerminalB_Modernization/ohare_modernization_proposal.pdf", file_type: "proposal" },
      { file_name: "completion_signoff.pdf", file_path: "Airport_TerminalB_Modernization/completion_signoff.pdf", file_type: "work_order" },
    ],
  },
  {
    customer_name: "Metro Plaza LLC",
    building_name: "Metro Plaza",
    address: "225 W Randolph St, Chicago, IL 60606",
    job_type: "Repair",
    stage: "In Progress",
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    notes: null,
    documents: [
      { file_name: "metro_plaza_work_order_42.pdf", file_path: "Metro_Plaza_Repair/metro_plaza_work_order_42.pdf", file_type: "work_order" },
    ],
  },
];
