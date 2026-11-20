export type ScreenplayModuleId =
  | 'overview'
  | 'story_bible'
  | 'characters'
  | 'locations'
  | 'timeline'
  | 'screenplay'
  | 'research'
  | 'notes';

export interface CharacterRelationship {
  targetCharacterId: string;
  relationLabel: string;
  tensionNote: string;
}

export interface CharacterDynamic {
  targetCharacterId: string;
  targetName: string;
  note: string;
  frictionTag: 'High Friction' | 'Hostile' | 'Confidant' | 'Alliance' | 'Neutral';
}

export interface ScreenplayCharacter {
  id: string;
  name: string;
  initials?: string;
  roleTag?: string;
  archetype?: string;
  age: string;
  statusLabel?: string;
  gender: string;
  occupation: string;
  role: 'Protagonist' | 'Deuteragonist' | 'Antagonist' | 'Supporting';
  appearance: string;
  personality: string;
  speechStyle: string;
  signatureProp?: string;
  debutScene?: string;
  backstory: string;
  want: string;
  need?: string;
  fatalFlaw?: string;
  fear: string;
  motivation: string;
  secret: string;
  arc: string;
  relationships: CharacterRelationship[];
  keyDynamics?: CharacterDynamic[];
  featuredSceneIds?: string[];
}

export interface ScreenplayLocation {
  id: string;
  name: string;
  intExt: 'INT.' | 'EXT.' | 'INT./EXT.';
  defaultTime: string;
  spatialContext: string;
  architecture: string;
  lighting: string;
  soundscape: string;
  regularCharacterIds: string[];
  referenceImageUrl: string;
}

export interface TimelineEvent {
  id: string;
  act: 'Act I — Thiết lập' | 'Act II-A — Đối đầu' | 'Act II-B — Biến cố' | 'Act III — Cao trào';
  order: number;
  timeMark: string;
  title: string;
  objectiveTruth: string;
  audienceKnowledge: string;
  secretOrTwist: string;
  revealTiming: string;
  consistencyNote: string;
}

export interface DialogueLine {
  id: string;
  characterId: string;
  characterName: string;
  parenthetical: string;
  text: string;
}

export interface ScreenplayScene {
  id: string;
  sceneNumber: string;
  title: string;
  act: TimelineEvent['act'];
  status: 'Outline' | 'Draft' | 'Revising' | 'Locked';
  intExt: 'INT.' | 'EXT.' | 'INT./EXT.';
  locationId: string;
  locationName: string;
  timeOfDay: string;
  actionDescription: string;
  dialogues: DialogueLine[];
  transition: string;
  characterIds: string[];
  relatedEventIds: string[];
  clue: string;
  purposeNote: string;
  updatedAt: number;
}

export interface ScriptVersionSnapshot {
  id: string;
  label: string;
  createdAt: number;
  sceneCount: number;
  totalWords: number;
  scenesSnapshot: ScreenplayScene[];
}

export interface ScreenplayResearchItem {
  id: string;
  category:
    | 'Tài liệu lịch sử'
    | 'Tâm lý học & Y khoa'
    | 'Hình ảnh tham khảo'
    | 'Đời sống & Xã hội'
    | 'Cybernetics & AI';
  title: string;
  verificationStatus: 'verified_fact' | 'creative_hypothesis';
  sourceUrl: string;
  referenceImageUrl: string;
  notes: string;
  createdAt: number;
}

export type StoryNoteCategory =
  | 'unplaced_idea'
  | 'sudden_dialogue'
  | 'potential_clue'
  | 'open_question'
  | 'discarded_idea';

export interface StoryNoteItem {
  id: string;
  category: StoryNoteCategory;
  title: string;
  content: string;
  discardReason?: string;
  resolved?: boolean;
  createdAt: number;
}

export interface ScreenplayProject {
  id: string;
  title: string;
  genre: string;
  format: string;
  status: 'Development' | 'First Draft' | 'Revising' | 'Final Polish';
  draftSubtitle?: string;
  currentTasks: string;
  nextStep: string;
  bible: {
    logline: string;
    synopsis: string;
    themeAndMessage: string;
    historicalSocialSetting: string;
    worldRulesAndCoreTruths: string;
    toneAndVisualStyle: string;
  };
  characters: ScreenplayCharacter[];
  locations: ScreenplayLocation[];
  timeline: TimelineEvent[];
  scenes: ScreenplayScene[];
  research: ScreenplayResearchItem[];
  notes: StoryNoteItem[];
  versions: ScriptVersionSnapshot[];
  lastOpenedSceneId: string;
  updatedAt: number;
}

export interface ScreenplayStudioState {
  activeProjectId: string;
  activeModule: ScreenplayModuleId;
  projects: ScreenplayProject[];
}

export const NOTE_CATEGORY_META: Record<
  StoryNoteCategory,
  { label: string; badge: string; color: string }
> = {
  unplaced_idea: {
    label: 'Ý tưởng chưa biết đặt ở đâu',
    badge: 'UNPLACED IDEA',
    color: 'var(--os-dusty-blue)',
  },
  sudden_dialogue: {
    label: 'Câu thoại bất chợt',
    badge: 'DIALOGUE SPARK',
    color: 'var(--os-brass)',
  },
  potential_clue: {
    label: 'Chi tiết có thể trở thành manh mối',
    badge: 'CLUE SEED',
    color: 'var(--os-sage)',
  },
  open_question: {
    label: 'Câu hỏi chưa giải quyết',
    badge: 'OPEN QUESTION',
    color: 'var(--os-crimson)',
  },
  discarded_idea: {
    label: 'Ý tưởng đã bỏ & Lý do bỏ',
    badge: 'ARCHIVED / DISCARDED',
    color: 'var(--os-ivory-faint)',
  },
};

export function buildStarterProject(now: number): ScreenplayProject {
  const firstScene: ScreenplayScene = {
    id: 'sc_01',
    sceneNumber: '01',
    title: 'Scene 01',
    act: 'Act I — Thiết lập',
    status: 'Draft',
    intExt: 'INT.',
    locationId: '',
    locationName: 'BỐI CẢNH MỚI',
    timeOfDay: 'ĐÊM',
    actionDescription: '',
    dialogues: [],
    transition: 'CUT TO:',
    characterIds: [],
    relatedEventIds: [],
    clue: '',
    purposeNote: '',
    updatedAt: now,
  };

  return {
    id: 'proj_user_01',
    title: 'Dự Án Kịch Bản Mới',
    draftSubtitle: 'DRAFT 1',
    genre: '',
    format: '',
    status: 'Development',
    currentTasks: '',
    nextStep: '',
    bible: {
      logline: '',
      synopsis: '',
      themeAndMessage: '',
      historicalSocialSetting: '',
      worldRulesAndCoreTruths: '',
      toneAndVisualStyle: '',
    },
    characters: [],
    locations: [],
    timeline: [],
    scenes: [firstScene],
    research: [],
    notes: [],
    versions: [],
    lastOpenedSceneId: 'sc_01',
    updatedAt: now,
  };
}

export function buildInitialScreenplayState(): ScreenplayStudioState {
  const now = Date.now();
  const starter = buildStarterProject(now);
  return {
    activeProjectId: starter.id,
    activeModule: 'screenplay',
    projects: [starter],
  };
}
