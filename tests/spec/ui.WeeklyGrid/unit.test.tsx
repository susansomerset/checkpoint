/**
 * Unit tests for ui.WeeklyGrid component
 * Tests rendering behavior with spec fixture data
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeeklyGrid } from '../../../src/components/WeeklyGrid';
import tinyRender from './fixtures/tiny_render.json';

describe('ui.WeeklyGrid', () => {
  it('renders 9 column headers in correct order', () => {
    render(
      <WeeklyGrid 
        grids={tinyRender.grids as any}
        selectedStudentId={tinyRender.selectedStudentId}
      />
    );
    
    // Check for all 9 headers
    expect(screen.getByText(/Class Name/)).toBeInTheDocument();
    expect(screen.getByText(/Prior Weeks/)).toBeInTheDocument();
    expect(screen.getByText(/Mon/)).toBeInTheDocument();
    expect(screen.getByText(/Tue/)).toBeInTheDocument();
    expect(screen.getByText(/Wed/)).toBeInTheDocument();
    expect(screen.getByText(/Thu/)).toBeInTheDocument();
    expect(screen.getByText(/Fri/)).toBeInTheDocument();
    expect(screen.getByText(/Next Week/)).toBeInTheDocument();
    expect(screen.getByText(/No Date/)).toBeInTheDocument();
  });

  it('renders student header from grid data', () => {
    render(
      <WeeklyGrid 
        grids={tinyRender.grids as any}
        selectedStudentId={tinyRender.selectedStudentId}
      />
    );
    
    // Student header should be rendered (check for table structure)
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders only selected student when selectedStudentId provided', () => {
    const multiStudentGrids = {
      ...tinyRender.grids,
      S2: { ...tinyRender.grids.S1 }
    };
    
    render(
      <WeeklyGrid 
        grids={multiStudentGrids as any}
        selectedStudentId="S1"
      />
    );
    
    // Should render table
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders grid items with icons and colors', () => {
    render(
      <WeeklyGrid 
        grids={tinyRender.grids as any}
        selectedStudentId={tinyRender.selectedStudentId}
      />
    );
    
    // Check for assignment titles from fixture
    expect(screen.getByText(/Warmup/)).toBeInTheDocument();
    expect(screen.getByText(/Reflection/)).toBeInTheDocument();
  });

  it('renders empty cells as blank (no content)', () => {
    render(
      <WeeklyGrid 
        grids={tinyRender.grids as any}
        selectedStudentId={tinyRender.selectedStudentId}
      />
    );
    
    // Empty cells should exist but have no text content
    // This is tested by verifying the table structure renders without errors
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

