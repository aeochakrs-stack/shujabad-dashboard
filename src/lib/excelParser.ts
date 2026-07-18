import * as XLSX from 'xlsx';

// This is the default structure we expect from the AEOs' Excel files.
// You can easily change these names to match your exact sheets later.
export interface SchoolDataRow {
  emis_code: string;
  school_name: string;
  markaz_name: string;
  total_students: number;
  present_teachers: number;
  funds_received: number;
  status: 'Active' | 'Inactive';
}

export async function parseExcelFile(file: File): Promise<{
  success: boolean;
  data: SchoolDataRow[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const errors: string[] = [];

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Assuming data is in the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert the sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const processedData: SchoolDataRow[] = [];

        // Loop through each row and check for errors or missing data
        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 because Excel starts at 1 and has a header row
          
          if (!row['EMIS Code']) {
            errors.push(`Row ${rowNum}: Missing EMIS Code`);
            return;
          }
          if (!row['School Name']) {
            errors.push(`Row ${rowNum}: Missing School Name for EMIS ${row['EMIS Code']}`);
            return;
          }

          processedData.push({
            emis_code: String(row['EMIS Code']),
            school_name: String(row['School Name']),
            markaz_name: String(row['Markaz'] || 'Unknown'),
            total_students: Number(row['Total Students'] || 0),
            present_teachers: Number(row['Present Teachers'] || 0),
            funds_received: Number(row['Funds Received'] || 0),
            status: row['Status'] === 'Inactive' ? 'Inactive' : 'Active',
          });
        });

        resolve({
          success: errors.length === 0,
          data: processedData,
          errors
        });

      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: ['Failed to read the Excel file. Please ensure it is a valid .xlsx or .xls file.']
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Error reading the file from your computer.']
      });
    };

    reader.readAsBinaryString(file);
  });
}
