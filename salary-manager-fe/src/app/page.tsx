'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import KPICards from '../components/KPICards';
import FilterToolbar from '../components/FilterToolbar';
import EmployeeTable from '../components/EmployeeTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import EmployeeModal from '../components/EmployeeModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import {
  Employee,
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
} from '../services';

export default function Home() {
  const queryClient = useQueryClient();

  // Filters state
  const [filters, setFilters] = useState<EmployeeFilterParams>({
    page: 1,
    page_size: 20,
    sort_by: 'last_name',
    sort_order: 'asc',
    search: '',
    department: [],
    country: [],
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // TanStack Queries
  const { data: employeeData, isLoading: loadingTable, isFetching: fetchingTable } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
    placeholderData: keepPreviousData,
  });

  const { data: kpi, isLoading: loadingKPI } = useQuery({
    queryKey: ['kpi-summary'],
    queryFn: fetchKPISummary,
  });

  const { data: deptAnalytics } = useQuery({
    queryKey: ['dept-analytics'],
    queryFn: fetchDepartmentAnalytics,
  });

  const { data: countryAnalytics } = useQuery({
    queryKey: ['country-analytics'],
    queryFn: fetchCountryAnalytics,
  });

  const { data: genderAnalytics } = useQuery({
    queryKey: ['gender-analytics'],
    queryFn: fetchGenderAnalytics,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['meta-departments'],
    queryFn: fetchDepartments,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['meta-countries'],
    queryFn: fetchCountries,
  });

  const { data: salaryBounds = { min_usd_salary: 0, max_usd_salary: 500000 } } = useQuery({
    queryKey: ['meta-salary-range'],
    queryFn: fetchSalaryRange,
  });

  // TanStack Mutations with automatic cache invalidation
  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      showToast('New employee created successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dept-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['country-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['gender-analytics'] });
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create employee';
      showToast(msg, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => updateEmployee(id, data),
    onSuccess: () => {
      showToast('Employee details updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dept-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['country-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['gender-analytics'] });
      setIsModalOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update employee';
      showToast(msg, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      showToast('Employee record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dept-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['country-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['gender-analytics'] });
      setIsDeleteOpen(false);
      setEmployeeToDelete(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete employee';
      showToast(msg, 'error');
    },
  });

  // Handlers for Filters, Sort & Pagination
  const handleFilterChange = (newFilters: Partial<EmployeeFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleResetFilters = () => {
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
    setFilters((prev) => {
      const isSameCol = prev.sort_by === column;
      const nextOrder = isSameCol && prev.sort_order === 'asc' ? 'desc' : 'asc';
      return { ...prev, sort_by: column, sort_order: nextOrder, page: 1 };
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters((prev) => ({ ...prev, page_size: newPageSize, page: 1 }));
  };

  // Modal Handlers
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

  const handleSaveEmployee = (formData: EmployeeFormData) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      deleteMutation.mutate(employeeToDelete.id);
    }
  };

  const handleExportCsv = () => {
    const downloadUrl = getExportCsvUrl(filters);
    window.open(downloadUrl, '_blank');
    showToast('Exporting employee CSV dataset...');
  };

  const employees = employeeData?.items || employeeData?.data || [];
  const pagination = employeeData?.pagination || { page: 1, page_size: 20, total_records: 0, total_pages: 0 };

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
        <KPICards kpi={kpi || null} loading={loadingKPI} />

        {/* Analytics Charts */}
        <AnalyticsCharts
          departmentData={deptAnalytics || null}
          countryData={countryAnalytics || null}
          genderData={genderAnalytics || null}
          loading={loadingKPI}
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
          isFetching={fetchingTable}
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
        deleting={deleteMutation.isPending}
      />
    </div>
  );
}
