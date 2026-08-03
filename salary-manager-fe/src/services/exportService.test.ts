import { describe, it, expect } from 'vitest';
import { getExportCsvUrl } from './exportService';

describe('Export Service (`services/exportService.ts`)', () => {
  it('getExportCsvUrl formats export endpoint with filters', () => {
    const url = getExportCsvUrl({ search: 'Jane', department: ['Sales'] });
    expect(url).toContain('/api/v1/export/csv?search=Jane&department=Sales');
  });
});
