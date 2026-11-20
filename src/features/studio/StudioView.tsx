import React from 'react';
import { SegmentedControl } from '../../components/ui/Primitives';
import { WorkflowVault } from './WorkflowVault';
import { PsychologyPipeline } from './PsychologyPipeline';

export function StudioView({
  subTab,
  onSubTabChange,
}: {
  subTab: 'workflow' | 'psychology';
  onSubTabChange: (v: 'workflow' | 'psychology') => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        value={subTab}
        onChange={onSubTabChange}
        options={[
          { value: 'workflow', label: 'Kho Workflow (3 ngày)' },
          { value: 'psychology', label: 'IG Tâm lý (7 ngày)' },
        ]}
      />

      {subTab === 'workflow' ? <WorkflowVault /> : <PsychologyPipeline />}
    </div>
  );
}
