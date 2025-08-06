import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils';
import { OptimizedDataTable, TableColumn } from '../OptimizedDataTable';

// ===========================================
// OPTIMIZED DATA TABLE COMPONENT TESTS
// ===========================================

describe('OptimizedDataTable', () => {
  // Test data
  const testData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Student', age: 20 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Tutor', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Student', age: 22 },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Admin', age: 30 },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Tutor', age: 28 }
  ];

  const columns: TableColumn<typeof testData[0]>[] = [
    { key: 'id', header: 'ID', width: 80, sortable: true },
    { key: 'name', header: 'Name', width: 200, sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { 
      key: 'role', 
      header: 'Role', 
      sortable: true,
      render: (value) => (
        <span className={`role-${value.toLowerCase()}`}>{value}</span>
      )
    },
    { key: 'age', header: 'Age', width: 80, sortable: true }
  ];

  describe('Basic Rendering', () => {
    test('should render table with data', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    test('should render loading state', () => {
      render(
        <OptimizedDataTable
          data={[]}
          columns={columns}
          keyField="id"
          loading={true}
        />
      );

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    test('should render empty state', () => {
      render(
        <OptimizedDataTable
          data={[]}
          columns={columns}
          keyField="id"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          className="custom-table-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-table-class');
    });
  });

  describe('Column Rendering', () => {
    test('should render custom cell content', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
        />
      );

      expect(screen.getByText('Student')).toHaveClass('role-student');
      expect(screen.getByText('Tutor')).toHaveClass('role-tutor');
      expect(screen.getByText('Admin')).toHaveClass('role-admin');
    });

    test('should handle missing data gracefully', () => {
      const dataWithMissing = [
        { id: 1, name: 'John Doe', email: null, role: 'Student' }
      ];

      render(
        <OptimizedDataTable
          data={dataWithMissing}
          columns={columns}
          keyField="id"
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Email cell should exist but be empty
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // Header + 1 data row
    });
  });

  describe('Search Functionality', () => {
    test('should show search input when searchable is true', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    test('should filter data based on search query', async () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    test('should search across all columns', async () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      // Search by email
      fireEvent.change(searchInput, { target: { value: 'alice@example.com' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Brown')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('should be case insensitive', async () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'JOHN' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    test('should show sort indicators when sortable is true', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          sortable={true}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toHaveClass('cursor-pointer');
    });

    test('should sort data when column header is clicked', async () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          sortable={true}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const firstDataRow = rows[1]; // Skip header row
        expect(firstDataRow).toHaveTextContent('Alice Brown');
      });
    });

    test('should toggle sort direction on repeated clicks', async () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          sortable={true}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      
      // First click - ascending
      fireEvent.click(nameHeader!);
      
      await waitFor(() => {
        expect(screen.getByText('↑')).toBeInTheDocument();
      });

      // Second click - descending
      fireEvent.click(nameHeader!);
      
      await waitFor(() => {
        expect(screen.getByText('↓')).toBeInTheDocument();
      });
    });

    test('should call onSort callback', () => {
      const onSort = jest.fn();
      
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          sortable={true}
          onSort={onSort}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);

      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });
  });

  describe('Pagination Functionality', () => {
    test('should show pagination when paginated is true', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          paginated={true}
          pageSize={2}
        />
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 2 of 5 results')).toBeInTheDocument();
    });

    test('should navigate between pages', async () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          paginated={true}
          pageSize={2}
        />
      );

      // Should show first 2 items initially
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();

      // Click next page
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    test('should disable navigation buttons appropriately', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          paginated={true}
          pageSize={2}
        />
      );

      // Previous should be disabled on first page
      expect(screen.getByText('Previous')).toBeDisabled();
      expect(screen.getByText('Next')).not.toBeDisabled();
    });
  });

  describe('Row Click Functionality', () => {
    test('should call onRowClick when row is clicked', () => {
      const onRowClick = jest.fn();
      
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      fireEvent.click(firstRow!);

      expect(onRowClick).toHaveBeenCalledWith(testData[0], 0);
    });

    test('should show cursor pointer when onRowClick is provided', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          onRowClick={() => {}}
        />
      );

      const firstRow = screen.getByText('John Doe').closest('tr');
      expect(firstRow).toHaveClass('cursor-pointer');
    });
  });

  describe('Virtualization Functionality', () => {
    test('should use virtualization for large datasets', () => {
      // Generate large dataset
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: 'Student',
        age: 20 + (i % 10)
      }));

      render(
        <OptimizedDataTable
          data={largeData}
          columns={columns}
          keyField="id"
          virtualized={true}
          containerHeight={400}
        />
      );

      // Should render table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      // Not all rows should be in DOM due to virtualization
      expect(screen.queryByText('User 100')).not.toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    test('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: i % 2 === 0 ? 'Student' : 'Tutor',
        age: 20 + (i % 10)
      }));

      const startTime = performance.now();
      
      render(
        <OptimizedDataTable
          data={largeData}
          columns={columns}
          keyField="id"
          searchable={true}
          sortable={true}
          paginated={true}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    test('should debounce search input', async () => {
      const { rerender } = render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      
      // Type quickly
      fireEvent.change(searchInput, { target: { value: 'j' } });
      fireEvent.change(searchInput, { target: { value: 'jo' } });
      fireEvent.change(searchInput, { target: { value: 'joh' } });
      fireEvent.change(searchInput, { target: { value: 'john' } });

      // Should not filter immediately
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Wait for debounce delay
      await waitFor(() => {
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(columns.length);
      expect(screen.getAllByRole('row')).toHaveLength(testData.length + 1); // +1 for header
    });

    test('should support keyboard navigation', () => {
      render(
        <OptimizedDataTable
          data={testData}
          columns={columns}
          keyField="id"
          sortable={true}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      
      // Should be focusable
      nameHeader?.focus();
      expect(nameHeader).toHaveFocus();

      // Should activate on Enter key
      fireEvent.keyDown(nameHeader!, { key: 'Enter' });
      expect(screen.getByText('↑')).toBeInTheDocument();
    });
  });
});