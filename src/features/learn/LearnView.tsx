import React from 'react';
import { SegmentedControl } from '../../components/ui/Primitives';
import { CodeLab } from './CodeLab';
import { ChessLab } from './ChessLab';
import { SudokuLab } from './SudokuLab';

export function LearnView({
  subTab,
  onSubTabChange,
}: {
  subTab: 'code' | 'chess' | 'sudoku';
  onSubTabChange: (v: 'code' | 'chess' | 'sudoku') => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        value={subTab}
        onChange={onSubTabChange}
        options={[
          { value: 'code', label: 'Code Core' },
          { value: 'chess', label: 'Cờ Vua' },
          { value: 'sudoku', label: 'Sudoku Logic' },
        ]}
      />

      {subTab === 'code' && <CodeLab />}
      {subTab === 'chess' && <ChessLab />}
      {subTab === 'sudoku' && <SudokuLab />}
    </div>
  );
}
