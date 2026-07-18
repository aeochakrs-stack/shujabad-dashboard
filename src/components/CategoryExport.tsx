'use client';

import ExportColumnSelector, { ExportColumn } from '@/components/ExportColumnSelector';
import * as XLSX from 'xlsx';

const COLUMNS: ExportColumn[] = [
    { key: 'emis_code', label: 'EMIS Code' },
    { key: 'school_name', label: 'School Name' },
    { key: 'markaz', label: 'Markaz' },
    { key: 'enrollment_current', label: 'Current Enrollment' },
    { key: 'enrollment_target', label: 'Target Enrollment' },
    { key: 'school_type', label: 'Type' },
    { key: 'school_gender', label: 'Gender' },
    { key: 'school_level', label: 'Level' },
    { key: 'psrp_phase', label: 'Phase' },
    { key: 'sis_password', label: 'SIS Password' },
    { key: 'dengue_password', label: 'Dengue Password' },
    { key: 'focal_person_cell', label: 'Focal Person Cell' }
];

export default function CategoryExport({ schools, categoryName }: { schools: any[], categoryName: string }) {
  const handleExport = (selectedKeys: string[]) => {
      const exportPayload = schools.map(item => {
          const fullRow: Record<string, any> = {
              emis_code: item.emis_code,
              school_name: item.school_name,
              markaz: item.markaz,
              enrollment_current: item.enrollment_current,
              enrollment_target: item.enrollment_target,
              school_type: item.school_type,
              school_gender: item.gender,
              school_level: item.level,
              psrp_phase: item.psrp_phase,
              sis_password: item.sis_password,
              dengue_password: item.dengue_password,
              focal_person_cell: item.focal_person_cell
          };

          const filteredRow: Record<string, any> = {};
          selectedKeys.forEach(key => {
              const colDef = COLUMNS.find(c => c.key === key);
              if (colDef) {
                  filteredRow[colDef.label] = fullRow[key];
              }
          });
          return filteredRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportPayload);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Schools");
      XLSX.writeFile(workbook, `${categoryName}_Schools_Export.xlsx`);
  };

  return (
      <ExportColumnSelector columns={COLUMNS} onExport={handleExport} />
  );
}
