import React from 'react';
import { SegmentedControl } from '../../components/ui/Primitives';
import { Bookshelf } from './Bookshelf';
import { StoryStudio } from './StoryStudio';
import { HobbiesJournal } from './HobbiesJournal';

export function VaultView({
  subTab,
  onSubTabChange,
}: {
  subTab: 'books' | 'stories' | 'hobbies';
  onSubTabChange: (v: 'books' | 'stories' | 'hobbies') => void;
}) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        value={subTab}
        onChange={onSubTabChange}
        options={[
          { value: 'books', label: 'Tủ Sách' },
          { value: 'stories', label: 'Viết Truyện' },
          { value: 'hobbies', label: 'Vẽ & Bơi' },
        ]}
      />

      {subTab === 'books' && <Bookshelf />}
      {subTab === 'stories' && <StoryStudio />}
      {subTab === 'hobbies' && <HobbiesJournal />}
    </div>
  );
}
