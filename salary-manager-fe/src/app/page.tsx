'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import KPICards from '../components/KPICards';
import FilterToolbar from '../components/FilterToolbar';
import EmployeeTable from '../components/EmployeeTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import EmployeeModal from '../components/EmployeeModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import {
  Employee,
  PaginationMeta,
  KPISummary,
  DepartmentAnalytics,
  CountryAnalytics,
  GenderAnalytics,
  EmployeeFilterParams,
  EmployeeFormData,
} from '../types';
import {
  fetchEmployees,
  fetchKPISummary,
  fetchDepartmentAnalytics,
  fetchCountryAnalytics,
  fetchGenderAnalytics,
  fetchDepartments,
  fetchCountries,
  fetchSalaryRange,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getExportCsvUrl,
} from '../services/api';

export default function Home() {
  // Master state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: 20,
    total_records: 0,
    total_pages: 0,
  });

  const [filters, setFilters] = useState<EmployeeFilterParams>({
    page: 1,
    page_size: 20,
    sort_by: 'last_name',
    sort_order: 'asc',
    search: '',
    department: [],
    country: [],
  });

  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [deptAnalytics, setDeptAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [countryAnalytics, setCountryAnalytics] = useState<CountryAnalytics | null>(null);
  const [genderAnalytics, setGenderAnalytics] = useState<GenderAnalytics | null>(null);

  const [departments, setDepartments] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [salaryBounds, setSalaryBounds] = useState<{ min_usd_salary: number; max_usd_salary: number }>({
    min_usd_salary: 0,
    max_usd_salary: 500000,
  });

  const [loadingTable, setLoadingTable] = useState<boolean>(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch Metadata choices
  useEffect(() => {
    let isMounted = true;
    const loadMeta = async () => {
      try {
        const [depts, ctrs, bounds] = await Promise.all([
          fetchDepartments(),
          fetchCountries(),
          fetchSalaryRange(),
        ]);
        if (isMounted) {
          setDepartments(depts);
          setCountries(ctrs);
          setSalaryBounds(bounds);
        }
      } catch (err: unknown) {
        console.error('Failed to load metadata:', err);
      }
    };
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Analytics (KPIs + Charts)
  const loadAnalytics = useCallback(async () => {
    try {
      const [kpiRes, deptRes, countryRes, genderRes] = await Promise.all([
        fetchKPISummary(),
        fetchDepartmentAnalytics(),
        fetchCountryAnalytics(),
        fetchGenderAnalytics(),
      ]);
      setKpi(kpiRes);
      setDeptAnalytics(deptRes);
      setCountryAnalytics(countryRes);
      setGenderAnalytics(genderRes);
    } catch (err: unknown) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Fetch Employees List
  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetchEmployees(filters);
      setEmployees(res.items || res.data || []);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load employees';
      showToast(msg, 'error');
    } finally {
      setLoadingTable(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const res = await fetchEmployees(filters);
        if (!ignore) {
          setEmployees(res.items || res.data || []);
          setPagination(res.pagination);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load employees';
          showToast(msg, 'error');
        }
      } finally {
        if (!ignore) setLoadingTable(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [filters, showToast]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const [kpiRes, deptRes, countryRes, genderRes] = await Promise.all([
          fetchKPISummary(),
          fetchDepartmentAnalytics(),
          fetchCountryAnalytics(),
          fetchGenderAnalytics(),
        ]);
        if (!ignore) {
          setKpi(kpiRes);
          setDeptAnalytics(deptRes);
          setCountryAnalytics(countryRes);
          setGenderAnalytics(genderRes);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        if (!ignore) setLoadingAnalytics(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  // Handlers for Filters, Sort & Pagination
  const handleFilterChange = (newFilters: Partial<EmployeeFilterParams>) => {
    setLoadingTable(true);
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleResetFilters = () => {
    setLoadingTable(true);
    setFilters({
      page: 1,
      page_size: 20,
      sort_by: 'last_name',
      sort_order: 'asc',
      search: '',
      department: [],
      country: [],
      min_usd_salary: undefined,
      max_usd_salary: undefined,
    });
  };

  const handleSortChange = (column: string) => {
    setLoadingTable(true);
    setFilters((prev) => {
      const isSameCol = prev.sort_by === column;
      const nextOrder = isSameCol && prev.sort_order === 'asc' ? 'desc' : 'asc';
      return { ...prev, sort_by: column, sort_order: nextOrder, page: 1 };
    });
  };

  const handlePageChange = (newPage: number) => {
    setLoadingTable(true);
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setLoadingTable(true);
    setFilters((prev) => ({ ...prev, page_size: newPageSize, page: 1 }));
  };

  // CRUD Mutations
  const handleOpenAddModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (emp: Employee) => {
    setEmployeeToDelete(emp);
    setIsDeleteOpen(true);
  };

  const handleSaveEmployee = async (formData: EmployeeFormData) => {
    try {
      if (selectedEmployee) {
        await updateEmployee(selectedEmployee.id, formData);
        showToast('Employee details updated successfully!');
      } else {
        await createEmployee(formData);
        showToast('New employee created successfully!');
      }
      setIsModalOpen(false);
      loadEmployees();
      loadAnalytics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save employee';
      showToast(msg, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true);
    try {
      await deleteEmployee(employeeToDelete.id);
      showToast('Employee record deleted successfully');
      setIsDeleteOpen(false);
      setEmployeeToDelete(null);
      loadEmployees();
      loadAnalytics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete employee';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const downloadUrl = getExportCsvUrl(filters);
    window.open(downloadUrl, '_blank');
    showToast('Exporting employee CSV dataset...');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar onExportCsv={handleExportCsv} />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 backdrop-blur-md transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border border-emerald-800'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Executive KPI Cards */}
        <KPICards kpi={kpi} loading={loadingAnalytics} />

        {/* Analytics Charts */}
        <AnalyticsCharts
          departmentData={deptAnalytics}
          countryData={countryAnalytics}
          genderData={genderAnalytics}
          loading={loadingAnalytics}
        />

        {/* Search & Filter Toolbar */}
        <FilterToolbar
          departments={departments}
          countries={countries}
          salaryBounds={salaryBounds}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {/* Employee Master Data Table */}
        <EmployeeTable
          employees={employees}
          pagination={pagination}
          sortBy={filters.sort_by || 'last_name'}
          sortOrder={filters.sort_order || 'asc'}
          loading={loadingTable}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEditEmployee={handleOpenEditModal}
          onDeleteEmployee={handleOpenDeleteModal}
          onAddEmployee={handleOpenAddModal}
        />
      </main>

      {/* Create / Edit Employee Modal */}
      <EmployeeModal
        key={selectedEmployee?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveEmployee}
        employee={selectedEmployee}
        departments={departments}
        countries={countries}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        employee={employeeToDelete}
        deleting={deleting}
      />
    </div>
  );
}
