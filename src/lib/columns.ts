import { ExportColumn } from "@/components/ExportColumnSelector";

export const SCHOOL_COLUMNS: ExportColumn[] = [
    { key: 'emis_code', label: 'EMIS Code' },
    { key: 'school_name', label: 'School Name' },
    { key: 'markaz', label: 'Markaz' },
    { key: 'tehsil', label: 'Tehsil' },
    { key: 'district', label: 'District' },
    { key: 'school_type', label: 'Type' },
    { key: 'gender', label: 'Gender' },
    { key: 'level', label: 'Level' },
    { key: 'psrp_phase', label: 'PSRP Phase' },
    { key: 'enrollment_baseline', label: 'Baseline Enrollment' },
    { key: 'enrollment_current', label: 'Current Enrollment' },
    { key: 'enr_primary', label: 'Primary Portion (K-5)' },
    { key: 'enr_middle', label: 'Middle Portion (6-8)' },
    { key: 'enr_high', label: 'High Portion (9-10)' },
    { key: 'enr_hsec', label: 'H.Sec Portion (11-12)' },
    { key: 'enrollment_target', label: 'Target Enrollment' },
    { key: 'total_sanctioned', label: 'Total Sanctioned' },
    { key: 'total_filled', label: 'Total Filled' },
    { key: 'total_vacant', label: 'Total Vacant' },
    { key: 'teachers_staff_total', label: 'Total Staff' },
    { key: 'sis_password', label: 'SIS Password' },
    { key: 'dengue_password', label: 'Dengue Password' },
    { key: 'focal_person_cell', label: 'Focal Person Cell' },
    { key: 'solar_meter_reference', label: 'Solar Ref' },
    { key: 'asp_head_name', label: 'Head Name' },
    { key: 'asp_head_contact', label: 'Head Contact' },
    { key: 'is_asp', label: 'Is ASP' }
];

export const STAFF_COLUMNS: ExportColumn[] = [
    { key: 'emis_code', label: 'EMIS Code' },
    { key: 'school_name', label: 'School Name' },
    { key: 'personnel_no', label: 'Personnel No.' },
    { key: 'teacher_name', label: 'Teacher Name' },
    { key: 'father_name', label: 'Father Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'bps', label: 'BPS' },
    { key: 'seniority', label: 'Seniority' },
    { key: 'gender', label: 'Gender' },
    { key: 'cnic', label: 'CNIC' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'date_of_joining', label: 'Date of Joining' },
    { key: 'retirement_date', label: 'Retirement Date' },
    { key: 'ba_bsc', label: 'BA/BSc' },
    { key: 'ma_msc', label: 'MA/MSc' },
    { key: 'bed', label: 'BEd' },
    { key: 'med', label: 'MEd' },
    { key: 'mphil', label: 'MPhil' },
    { key: 'phd', label: 'PhD' },
    { key: 'permanent_address', label: 'Permanent Address' },
    { key: 'present_address', label: 'Present Address' },
    { key: 'casual_leaves', label: 'Casual Leaves' },
    { key: 'earned_leaves', label: 'Earned Leaves' },
    { key: 'medical_leaves', label: 'Medical Leaves' },
    { key: 'is_dengue_focal_person', label: 'Dengue Focal Person' }
];

export const DEFAULT_SCHOOL_COLS = ['emis_code', 'school_name', 'markaz', 'school_type', 'level', 'enrollment_current', 'total_sanctioned', 'total_filled', 'total_vacant'];
export const DEFAULT_STAFF_COLS = ['emis_code', 'teacher_name', 'designation', 'cnic', 'phone'];
