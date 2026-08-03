import { describe, it, expect } from 'vitest';
import { getExportCsvUrl } from './exportService';

describe('Export Service (`services/exportService.ts`)', () => {
  it('getExportCsvUrl formats export endpoint with search and department filters', () => {
    const url = getExportCsvUrl({ search: 'Jane', department: ['Sales'] });
    expect(url).toContain('/api/v1/export/csv?search=Jane&department=Sales');
  });

  it('getExportCsvUrl formats export endpoint with all filter parameters', () => {
    const url = getExportCsvUrl({
      search: 'John',
      min_usd_salary: 40000,
      max_usd_salary: 120000,
      department: ['Engineering', 'Marketing'],
      country: ['USA', 'India'],
    });
    expect(url).toContain('/api/v1/export/csv?search=John&min_usd_salary=40000&max_usd_salary=120000&department=Engineering&department=Marketing&country=USA&country=India');
  });

  it('getExportCsvUrl returns base URL without query params when empty', () => {
    const url = getExportCsvUrl();
    expect(url).toBe('http://localhost:8000/api/v1/export/csv?');
  });
});
