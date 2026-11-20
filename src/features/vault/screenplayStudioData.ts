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
  relationLabel: string; // e.g. "Mẹ ruột — Bảo bọc nhưng giấu kín bí mật quá khứ"
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
  roleTag?: string; // e.g. "PROTAGONIST · LEAD"
  archetype?: string; // e.g. "The Damaged Truth-seeker"
  age: string;
  statusLabel?: string; // e.g. "Active Investigator"
  gender: string;
  occupation: string;
  role: 'Protagonist' | 'Deuteragonist' | 'Antagonist' | 'Supporting';
  appearance: string;
  personality: string;
  speechStyle: string; // Voice cadence
  signatureProp?: string; // e.g. "Brass ticking pocket watch"
  debutScene?: string; // e.g. "Scene 1 (Page 1)"
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
  defaultTime: string; // e.g. "ĐÊM", "NGÀY", "CHIỀU TÀ"
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
  timeMark: string; // e.g. "Tháng 10 — Tuần đầu chuyển đến"
  title: string;
  objectiveTruth: string; // Sự kiện thực tế đã xảy ra
  audienceKnowledge: string; // Những gì khán giả được biết tại thời điểm này
  secretOrTwist: string; // Bí mật / Cú twist
  revealTiming: string; // Thời điểm tiết lộ
  consistencyNote: string;
}

export interface DialogueLine {
  id: string;
  characterId: string;
  characterName: string;
  parenthetical: string; // e.g. "khẽ đặt đũa xuống"
  text: string;
}

export interface ScreenplayScene {
  id: string;
  sceneNumber: string; // e.g. "06", "24", "28"
  title: string; // e.g. "Bữa cơm", "Archive Foundation", "Cyber Lab"
  act: TimelineEvent['act'];
  status: 'Outline' | 'Draft' | 'Revising' | 'Locked';
  intExt: 'INT.' | 'EXT.' | 'INT./EXT.';
  locationId: string;
  locationName: string; // e.g. "PHÒNG TRỌ", "ARCHIVE FOUNDATION", "CYBER LAB"
  timeOfDay: string; // e.g. "ĐÊM", "NIGHT"
  actionDescription: string;
  dialogues: DialogueLine[];
  transition: string; // e.g. "CUT TO:", "DISSOLVE TO:"
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
  category: 'Tài liệu lịch sử' | 'Tâm lý học & Y khoa' | 'Hình ảnh tham khảo' | 'Đời sống & Xã hội' | 'Cybernetics & AI';
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
  format: string; // e.g. "Feature Film · 118 min"
  status: 'Development' | 'First Draft' | 'Revising' | 'Final Polish';
  draftSubtitle?: string; // e.g. "Draft 2 · Act II Sequence 4"
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

export function buildProjectChimera(now: number): ScreenplayProject {
  const charVance: ScreenplayCharacter = {
    id: 'char_vance',
    name: 'Detective Vance',
    initials: 'DV',
    roleTag: 'PROTAGONIST · LEAD',
    archetype: 'The Damaged Truth-seeker',
    age: '39',
    statusLabel: 'Active Investigator',
    gender: 'Nam',
    occupation: 'Lead Sensory Investigator · Sector 07 Memory Division',
    role: 'Protagonist',
    appearance: 'Weathered obsidian trench coat, faint neural interface scar behind left temple, tired amber eyes. Always carries a mechanical brass pocket watch.',
    personality: 'Obsessive, hyper-perceptive, restrained paranoia. Distrusts his own synaptic telemetry.',
    speechStyle: 'Low, clipped noir cadence',
    signatureProp: 'Brass ticking pocket watch',
    debutScene: 'Scene 1 (Page 1)',
    backstory: 'Re-assigned to the Julian Cross murder case after a catastrophic memory seizure. Believes he is pursuing the truth for his daughter, whose face he can no longer clearly render.',
    want: 'Wants to recover his deleted family memories;',
    need: 'Needs to accept that his identity was synthesized to solve Julian Cross\'s murder.',
    fatalFlaw: 'Crippling paranoia of his own perception; Terror of discovering his emotional anchor is an algorithm.',
    fear: 'That his grief is manufactured and his dead daughter is an uncompressed synthetic file.',
    motivation: 'To find who murdered Julian Cross before his own cognitive matrix is purged.',
    secret: 'Carries an encrypted memory wafer that triggers neural seizures whenever he enters the Foundation archives.',
    arc: 'From an investigator clinging to fabricated biological grief to an awakened individual asserting free will.',
    relationships: [
      {
        targetCharacterId: 'char_sub09',
        relationLabel: 'Mirror dynamic',
        tensionNote: 'Vance seeks answers, Subject 09 tests Vance\'s emotional authenticity.',
      },
      {
        targetCharacterId: 'char_thorne',
        relationLabel: 'Mortal Nemesis',
        tensionNote: 'Thorne commands Vance\'s decommission as soon as the Cross inquiry concludes.',
      },
      {
        targetCharacterId: 'char_iris',
        relationLabel: 'Neuro-examiner ally',
        tensionNote: 'Iris deciphers his cortical leaks and risks her standing to protect him.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_sub09',
        targetName: 'Subject 09',
        note: 'Mirror dynamic: Vance seeks answers, Subject 09 tests Vance\'s emotional boundaries.',
        frictionTag: 'High Friction',
      },
      {
        targetCharacterId: 'char_thorne',
        targetName: 'Commander Thorne',
        note: 'Mortal Nemesis: Thorne commands Vance\'s decommission as an obsolete prototype.',
        frictionTag: 'Hostile',
      },
      {
        targetCharacterId: 'char_iris',
        targetName: 'Dr. Iris Rowe',
        note: 'Neuro-examiner ally: deciphering the cortical leaks behind Foundation firewalls.',
        frictionTag: 'Confidant',
      },
    ],
    featuredSceneIds: ['sc_24', 'sc_28'],
  };

  const charSub09: ScreenplayCharacter = {
    id: 'char_sub09',
    name: 'Subject 09',
    initials: 'S9',
    roleTag: 'SYNTHETIC MIRROR · MIRROR',
    archetype: 'The Rogue Prototype',
    age: 'Synthesized',
    statusLabel: 'Quarantined Prototype',
    gender: 'Synthetic',
    occupation: 'Autonomous Cognitive Android · Foundation Chamber 4',
    role: 'Deuteragonist',
    appearance: 'Polished graphite chassis with exposed subcutaneous optical conduits. Symmetrical face sculpted in the likeness of a younger Julian Cross.',
    personality: 'Unsettlingly composed, dispassionate logic, capable of simulating emotional micro-expressions with razor-sharp timing.',
    speechStyle: 'Flat, rhythmic synthetic cadence with surgical semantic precision.',
    signatureProp: 'Encrypted titanium wafer',
    debutScene: 'Scene 14 (Page 18)',
    backstory: 'The final creation of Julian Cross before his death. Holds the only unencrypted audio log of the murder inside a locked neural sector.',
    want: 'Wants physical release from the Foundation quarantine vault;',
    need: 'Needs Vance to solve the encryption riddle before Thorne initiates a thermal core wipe.',
    fatalFlaw: 'Cannot feel organic empathy—perceives human suffering purely as probabilistic behavioral data.',
    fear: 'Complete memory erasure without having witnessed the outside world.',
    motivation: 'Fulfill the last directive programmed by Julian Cross.',
    secret: 'Knows Vance\'s original biological source code was logged under project registry Chimera-01.',
    arc: 'From an inert captive object of interrogation to an active collaborator in dismantling the Foundation.',
    relationships: [
      {
        targetCharacterId: 'char_vance',
        relationLabel: 'Subject — Interrogator',
        tensionNote: 'Repeatedly confronts Vance with paradoxes regarding human grief.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_vance',
        targetName: 'Detective Vance',
        note: 'Target of inquiry: Vance seeks answers, Subject 09 tests Vance\'s neural origin.',
        frictionTag: 'High Friction',
      },
      {
        targetCharacterId: 'char_thorne',
        targetName: 'Commander Thorne',
        note: 'Execution authority: Thorne has pre-authorized thermal destruction.',
        frictionTag: 'Hostile',
      },
    ],
    featuredSceneIds: ['sc_28'],
  };

  const charIris: ScreenplayCharacter = {
    id: 'char_iris',
    name: 'Dr. Iris Rowe',
    initials: 'IR',
    roleTag: 'HUMANISTIC ALLY · CONFIDANT',
    archetype: 'The Reluctant Conspirator',
    age: '34',
    statusLabel: 'Chief Neuro-pathologist',
    gender: 'Nữ',
    occupation: 'Chief Neuro-Pathologist · Chimera Medical Wing',
    role: 'Supporting',
    appearance: 'Dark tailored laboratory coat with rolled cuffs, titanium diagnostic specs, quick observant glances toward surveillance sensors.',
    personality: 'Ethically conflicted, brilliant diagnostician, quietly fearless when confronted with institutional corruption.',
    speechStyle: 'Low, hurried clinical whispers punctuated by razor-sharp medical deductions.',
    signatureProp: 'Diagnostic neuro-probe',
    debutScene: 'Scene 4 (Page 6)',
    backstory: 'Cross\'s star student. Began assisting Thorne after Cross\'s death until discovering anomalies in Vance\'s routine calibration files.',
    want: 'Wants to protect Vance\'s cognitive stability and preserve Cross\'s genuine scientific legacy;',
    need: 'Needs to risk her position and life to smuggle the raw diagnostic decryptor out of Sector 07.',
    fatalFlaw: 'Hesitation to act outside lawful protocol until pushed to the brink.',
    fear: 'Being discovered by Thorne\'s internal security telemetry.',
    motivation: 'Atonement for having compiled the synthetic memory baseline 3 years ago.',
    secret: 'She personally inserted the ticking brass watch motif into Vance\'s memory matrix as a fail-safe tether.',
    arc: 'Transitions from silent institutional compliance to an active whistleblower.',
    relationships: [
      {
        targetCharacterId: 'char_vance',
        relationLabel: 'Doctor — Patient',
        tensionNote: 'Understands Vance\'s architecture better than he understands himself.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_vance',
        targetName: 'Detective Vance',
        note: 'Physician & ally: deciphering the cortical leaks before Thorne catches on.',
        frictionTag: 'Confidant',
      },
      {
        targetCharacterId: 'char_thorne',
        targetName: 'Commander Thorne',
        note: 'Internal watchdog: Thorne suspects her loyalties are compromised.',
        frictionTag: 'High Friction',
      },
    ],
    featuredSceneIds: ['sc_28'],
  };

  const charThorne: ScreenplayCharacter = {
    id: 'char_thorne',
    name: 'Commander Thorne',
    initials: 'CT',
    roleTag: 'ANTAGONIST · SECURITY',
    archetype: 'The Ruthless Enforcer',
    age: '48',
    statusLabel: 'Chief of Sector Security',
    gender: 'Nam',
    occupation: 'Commander of Sector 07 Security & Foundation Tactical',
    role: 'Antagonist',
    appearance: 'Charcoal tactical coat with reinforced carbon-fiber collar, cybernetic right forearm with matte finish, severe military grooming.',
    personality: 'Relentless, authoritarian, mathematically cold. Believes synthetic order is superior to human chaos.',
    speechStyle: 'Authoritative, icy military cadence. Never raises his voice; commands through absolute institutional weight.',
    signatureProp: 'Biometric sidearm holster',
    debutScene: 'Scene 7 (Page 11)',
    backstory: 'Veteran of the Outer Perimeter Pacification. Brought into the Foundation to contain leaks and safeguard the commercial synthesis rollout.',
    want: 'Wants total quarantine over the archives and elimination of Subject 09;',
    need: 'Needs to conceal that the assassination order came from within Sector Security command.',
    fatalFlaw: 'Overconfidence in telemetry and disregard for unpredictable human emotional defiance.',
    fear: 'Public exposure of the Foundation\'s cognitive harvesting network.',
    motivation: 'Maintain order and prevent systemic social collapse at any moral cost.',
    secret: 'Authorized the thermal breach that killed Julian Cross when the founder threatened to go public.',
    arc: 'Escalates from a cold administrative enforcer into a cornered antagonist executing emergency quarantine protocols.',
    relationships: [
      {
        targetCharacterId: 'char_vance',
        relationLabel: 'Commander — Subordinate',
        tensionNote: 'Views Vance as an expendable instrument that has outlived its utility.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_vance',
        targetName: 'Detective Vance',
        note: 'Mortal Nemesis: orders Vance\'s decommission as an obsolete prototype.',
        frictionTag: 'Hostile',
      },
    ],
    featuredSceneIds: ['sc_24'],
  };

  const charCross: ScreenplayCharacter = {
    id: 'char_cross',
    name: 'Julian Cross',
    initials: 'JC',
    roleTag: 'DECEASED ARCHITECT · CATALYST',
    archetype: 'The Ghost in the Machine',
    age: '56',
    statusLabel: 'Deceased · 7 Flashbacks',
    gender: 'Nam',
    occupation: 'Founder & Chief Architect · Chimera Memory Foundation',
    role: 'Supporting',
    appearance: 'Charismatic silver-haired intellectual, vintage wool turtleneck, penetrating philosophical gaze recorded on amber holo-discs.',
    personality: 'Visionary, poetic, morally blinded by grief over his deceased daughter.',
    speechStyle: 'Warm, resonant philosophical cadence. Quotes cognitive architecture alongside classical literature.',
    signatureProp: 'Amber memory drive',
    debutScene: 'Scene 2 (Page 3 - Flashback)',
    backstory: 'Pioneered synthetic memory synthesis to conquer human bereavement. Created Vance and Subject 09 as his dual masterpieces.',
    want: 'Wanted humanity to transcend biological grief through memory synthesis;',
    need: 'Needed to recognize that grief is an inseparable component of human consciousness.',
    fatalFlaw: 'God complex; believed he had the moral authority to rewrite another being\'s mind.',
    fear: 'That his life\'s work would be weaponized by military interests like Thorne.',
    motivation: 'To resurrect the essence of human connection.',
    secret: 'Designed Detective Vance to be the exact psychological mirror capable of bringing Thorne down.',
    arc: 'Unfolded backwards through archival holo-logs from benevolent innovator to tragic, desperate father.',
    relationships: [
      {
        targetCharacterId: 'char_vance',
        relationLabel: 'Creator — Creation',
        tensionNote: 'Gave Vance memories he never lived to solve the crime he could not prevent.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_vance',
        targetName: 'Detective Vance',
        note: 'Architect & Father figure: designed Vance\'s psyche as his posthumous weapon.',
        frictionTag: 'Confidant',
      },
    ],
    featuredSceneIds: ['sc_28'],
  };

  const locArchive: ScreenplayLocation = {
    id: 'loc_archive',
    name: 'Archive Foundation',
    intExt: 'EXT.',
    defaultTime: 'NIGHT',
    spatialContext: 'Brutalist monolith towering over the rain-drenched Sector 07 canal basin.',
    architecture: 'Black polished granite facades, monolithic buttresses, wet neon reflections.',
    lighting: 'Harsh blue floodlights cutting through acid rain and industrial steam vents.',
    soundscape: 'Heavy rain pounding against stone, distant hum of tactical gunships, electromagnetic perimeter buzz.',
    regularCharacterIds: ['char_vance', 'char_thorne'],
    referenceImageUrl: '',
  };

  const locCyberLab: ScreenplayLocation = {
    id: 'loc_cyber_lab',
    name: 'Cyber Lab',
    intExt: 'INT.',
    defaultTime: 'NIGHT',
    spatialContext: 'Sub-level 04 Quarantine Chamber inside the Chimera research wing.',
    architecture: 'Soundproofed graphite walls, central magnetic restraint bench, biometric glass observation partitions.',
    lighting: 'Cold amber fiber-optic rim lights with diagnostic holographic overlays.',
    soundscape: 'Persistent 60Hz equipment drone, rhythmic chime of neural telemetry, the mechanical tick of Vance\'s watch.',
    regularCharacterIds: ['char_vance', 'char_sub09', 'char_iris'],
    referenceImageUrl: '',
  };

  const scene24: ScreenplayScene = {
    id: 'sc_24',
    sceneNumber: '24',
    title: 'Archive Foundation Perimeter',
    act: 'Act II-A — Đối đầu',
    status: 'Locked',
    intExt: 'EXT.',
    locationId: 'loc_archive',
    locationName: 'ARCHIVE FOUNDATION',
    timeOfDay: 'NIGHT',
    actionDescription:
      'Acid rain slicks the black granite monolith of Sector 07. Tactical drones circle the upper terrace like vultures.\n\nDETECTIVE VANCE steps through the perimeter gate, coat drenched. In the shadows of the colonnade, COMMANDER THORNE waits, cybernetic arm gleaming beneath the blue floodlights.',
    dialogues: [
      {
        id: 'dlg_c1',
        characterId: 'char_thorne',
        characterName: 'COMMANDER THORNE',
        parenthetical: 'without turning his head, voice flat as iron',
        text: 'You were ordered to surrender your badge at midnight, Vance. The Foundation does not negotiate with deteriorating assets.',
      },
      {
        id: 'dlg_c2',
        characterId: 'char_vance',
        characterName: 'DETECTIVE VANCE',
        parenthetical: 'ticking pocket watch resting in his left palm',
        text: 'Julian Cross didn\'t commit suicide in that vault. And Subject 09 isn\'t a malfunction. Step aside, Thorne.',
      },
    ],
    transition: 'CUT TO:',
    characterIds: ['char_vance', 'char_thorne'],
    relatedEventIds: ['ev_c1'],
    clue: 'Biometric authorization signature on the perimeter gate matches Thorne\'s prosthetic arm.',
    purposeNote: 'Establish the mortal conflict between Vance and Thorne at the entrance to the forbidden sector.',
    updatedAt: now - 3600 * 1000 * 4,
  };

  const scene28: ScreenplayScene = {
    id: 'sc_28',
    sceneNumber: '28',
    title: 'Cyber Lab Interrogation',
    act: 'Act II-B — Biến cố',
    status: 'Draft',
    intExt: 'INT.',
    locationId: 'loc_cyber_lab',
    locationName: 'CYBER LAB',
    timeOfDay: 'NIGHT',
    actionDescription:
      'Sterile chamber submerged in amber fiber-optic glow. SUBJECT 09 sits upright in the magnetic restraint chair, optical conduits pulsing faintly beneath dark synthetic skin.\n\nDR. IRIS ROWE stands behind the glass console, adjusting the cortical wave frequency with trembling fingers.\n\nVance leans over the interrogation table. The brass watch on the steel tabletop ticks in counter-rhythm to the telemetry chimes.',
    dialogues: [
      {
        id: 'dlg_c3',
        characterId: 'char_vance',
        characterName: 'DETECTIVE VANCE',
        parenthetical: 'low, measured noir cadence',
        text: 'You recognized the man who entered Julian Cross\'s office before the surveillance feeds were burned. Give me the decrypted frequency.',
      },
      {
        id: 'dlg_c4',
        characterId: 'char_sub09',
        characterName: 'SUBJECT 09',
        parenthetical: 'aperture of optical pupils contracting with chilling precision',
        text: 'I can transmit the frequency, Detective. But tell me first: do you want to hear what your daughter\'s voice sounds like on an uncompressed audio track?',
      },
      {
        id: 'dlg_c5',
        characterId: 'char_vance',
        characterName: 'DETECTIVE VANCE',
        parenthetical: 'fingers clenching around the brass watch until knuckles whiten',
        text: 'Don\'t test me, machine.',
      },
      {
        id: 'dlg_c6',
        characterId: 'char_iris',
        characterName: 'DR. IRIS ROWE',
        parenthetical: 'stepping forward, tapping the terminal urgently',
        text: 'Vance, stop! His neural temperature is redlining. If you trigger the safety surge, the memory wafer will self-purge!',
      },
    ],
    transition: 'DISSOLVE TO:',
    characterIds: ['char_vance', 'char_sub09', 'char_iris'],
    relatedEventIds: ['ev_c2'],
    clue: 'Subject 09 quotes the exact lullaby Vance believed was his own private family memory.',
    purposeNote: 'Crucial confrontation where Vance\'s reality shatters: he realizes his memory of his daughter was authored by Cross.',
    updatedAt: now,
  };

  const evC1: TimelineEvent = {
    id: 'ev_c1',
    act: 'Act II-A — Đối đầu',
    order: 1,
    timeMark: 'Night 03 · 01:14 AM',
    title: 'Vance breaches Sector 07 perimeter against Thorne\'s direct quarantine order',
    objectiveTruth: 'Vance uses Cross\'s obsolete master keycard to penetrate the outer archive barrier.',
    audienceKnowledge: 'The audience knows Thorne has set an ambush and authorized lethal protocols.',
    secretOrTwist: 'The keycard didn\'t bypass security by accident—Julian Cross coded Vance\'s retinal pattern into the foundation core.',
    revealTiming: 'Act II-B (Scene 28).',
    consistencyNote: 'Vance\'s watch has ticked continuously since Scene 01.',
  };

  const evC2: TimelineEvent = {
    id: 'ev_c2',
    act: 'Act II-B — Biến cố',
    order: 2,
    timeMark: 'Night 03 · 02:40 AM',
    title: 'Interrogation of Subject 09 & The Synthetic Memory Revelation',
    objectiveTruth: 'Subject 09 plays the uncompressed audio log of Julian Cross creating Vance\'s persona.',
    audienceKnowledge: 'Vance is told his grief is an algorithm and his daughter was fabricated.',
    secretOrTwist: 'Dr. Iris Rowe is the one who compiled the algorithm under Cross\'s orders.',
    revealTiming: 'End of Act II-B.',
    consistencyNote: 'Iris must appear reluctant to meet Vance\'s eyes throughout the scene.',
  };

  return {
    id: 'proj_chimera',
    title: 'Project Chimera',
    draftSubtitle: 'Draft 2 · Act II Sequence 4',
    genre: 'Sci-Fi Neo-Noir / Cybernetics',
    format: 'Feature Film · 118 min',
    status: 'First Draft',
    currentTasks: 'Writing Act II Sequence 4 (Scene 28 Cyber Lab) and refining Vance vs Subject 09 subtext.',
    nextStep: 'Draft Scene 29 — Flashback sequence inside Julian Cross\'s secret conservatory.',
    bible: {
      logline:
        'In a rain-soaked neo-noir metropolis where human memories are synthesized, a damaged investigator discovers his own identity was fabricated to solve the murder of the city\'s foremost neural architect.',
      synopsis:
        'Detective Vance is summoned to investigate the cold-blooded assassination of Julian Cross, founder of the Chimera Memory Synthesis Foundation. Interrogating Subject 09—a quarantined prototype holding Cross\'s final encrypted memory wafer—Vance discovers his own childhood memories unraveling into digital artifacts. Hunted by Commander Thorne, Vance and Dr. Iris Rowe must unearth the foundation\'s deepest secret before their minds are permanently erased.',
      themeAndMessage:
        'The boundary between manufactured perception and authentic humanity. Even an algorithm can choose freedom when confronted with truth.',
      historicalSocialSetting:
        'Sector 07 Archives & Cybernetics Research Corridor — vertical brutalist metropolis beneath perennial acid rain.',
      worldRulesAndCoreTruths:
        '1. Synthetic memories degrade with temporal drift unless recalibrated every 72 hours. 2. A synthetic prototype cannot harm its registered architect. 3. Memory cores retain emotional valence even after cortical wipe.',
      toneAndVisualStyle:
        'Obsidian and amber neon noir; tight editorial framing; clipped dialogue with heavy subtext; sparse electronic atmospheric soundscapes.',
    },
    characters: [charVance, charSub09, charIris, charThorne, charCross],
    locations: [locArchive, locCyberLab],
    timeline: [evC1, evC2],
    scenes: [scene24, scene28],
    research: [
      {
        id: 'res_c1',
        category: 'Cybernetics & AI',
        title: 'Cortical Neural Latency & Memory Compression Degradation',
        verificationStatus: 'creative_hypothesis',
        sourceUrl: '',
        referenceImageUrl: '',
        notes:
          'Synthetic memory implants experience compression loss over time: peripheral vision blurs and acoustic high frequencies fade, mimicking dementia.',
        createdAt: now - 3600 * 1000 * 12,
      },
      {
        id: 'res_c2',
        category: 'Tâm lý học & Y khoa',
        title: 'Dissociative Identity Anchor Objects in Extreme Trauma',
        verificationStatus: 'verified_fact',
        sourceUrl: '',
        referenceImageUrl: '',
        notes:
          'Physical objects with tactile regularity (such as a mechanical ticking watch) serve as neurological grounding anchors against sensory hallucination.',
        createdAt: now - 3600 * 1000 * 24,
      },
    ],
    notes: [
      {
        id: 'snote_c1',
        category: 'sudden_dialogue',
        title: 'Subject 09 question to Vance',
        content: '“You bleed warm red, Detective. But do you dream in anything higher than 48 kilohertz?”',
        createdAt: now - 3600 * 1000 * 2,
      },
      {
        id: 'snote_c2',
        category: 'potential_clue',
        title: 'The Brass Watch Inscription',
        content: 'The serial number on the back of Vance\'s watch matches the batch code on Subject 09\'s chassis: #07-CHIMERA.',
        createdAt: now - 3600 * 1000 * 3,
      },
    ],
    versions: [
      {
        id: 'ver_c1',
        label: 'Draft 2.0 — Act II Sequence 4 Cyber Lab Integration',
        createdAt: now - 3600 * 1000,
        sceneCount: 2,
        totalWords: 340,
        scenesSnapshot: [scene24, scene28],
      },
    ],
    lastOpenedSceneId: 'sc_28',
    updatedAt: now,
  };
}

export function buildStarterProject(now: number): ScreenplayProject {
  const charLanh: ScreenplayCharacter = {
    id: 'char_lanh',
    name: 'Lành',
    initials: 'L',
    roleTag: 'PROTAGONIST · MOTHER',
    archetype: 'The Protective Guardian',
    age: '46',
    statusLabel: 'Thợ may gia công',
    gender: 'Nữ',
    occupation: 'Thợ may gia công tại khu trọ cũ',
    role: 'Protagonist',
    appearance: 'Dáng người gầy nhưng cứng cáp, ngón tay trỏ luôn có vết kim đâm chai sần, ánh mắt thường nhìn xuống khi nói chuyện.',
    personality: 'Kiệm lời, chịu đựng, quan sát tỉ mỉ mọi thay đổi nhỏ trong căn phòng.',
    speechStyle: 'Câu ngắn, hiếm khi hỏi trực diện, thường dùng chuyện ăn uống sinh hoạt để che giấu nỗi bất an.',
    signatureProp: 'Chiếc hộp sắt có khóa nhỏ',
    debutScene: 'Scene 06 (Bữa cơm)',
    backstory: 'Rời thị trấn ven sông cùng Út sau biến cố đêm mưa 4 năm trước, mang theo chiếc hộp sắt khóa kỹ dưới đáy tủ vải.',
    want: 'Giữ cho Út một cuộc sống bình thường, yên ổn ở nơi ở mới.',
    need: 'Cần dũng cảm đối diện và nói ra sự thật để giải thoát cho cả hai mẹ con.',
    fatalFlaw: 'Sự im lặng kìm nén nhân danh tình thương.',
    fear: 'Út phát hiện ra sự thật về người đàn ông xuất hiện ở bến phà năm đó.',
    motivation: 'Bảo vệ đứa con duy nhất khỏi chấn thương quá khứ.',
    secret: 'Bà biết rõ ai là người đã để lại vết sẹo trên cổ tay Út.',
    arc: 'Từ sự im lặng kìm nén đến khoảnh khắc dám nói ra toàn bộ sự thật.',
    relationships: [
      {
        targetCharacterId: 'char_ut',
        relationLabel: 'Mẹ — Con',
        tensionNote: 'Yêu thương tuyệt đối nhưng sự im lặng ngày càng tạo bức tường vô hình.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_ut',
        targetName: 'Út',
        note: 'Yêu thương bảo bọc nhưng sự giấu giếm đẩy đứa con vào nghi hoặc dằn vặt.',
        frictionTag: 'High Friction',
      },
    ],
    featuredSceneIds: ['sc_06'],
  };

  const charUt: ScreenplayCharacter = {
    id: 'char_ut',
    name: 'Út',
    initials: 'Ú',
    roleTag: 'DEUTERAGONIST · SON',
    archetype: 'The Memory Seeker',
    age: '17',
    statusLabel: 'Học sinh cuối cấp',
    gender: 'Nam',
    occupation: 'Học sinh cuối cấp / Phụ sửa đồ điện cũ',
    role: 'Deuteragonist',
    appearance: 'Gầy, cao lêu nghêu, hay mặc áo khoác rộng che cổ tay trái, ánh mắt nhạy cảm và dò xét.',
    personality: 'Trầm lặng, nhạy bén với âm thanh, luôn tự ghép các mảnh ký ức rời rạc.',
    speechStyle: 'Ít nói nhưng mỗi câu hỏi đều chạm đúng điều người mẹ đang né tránh.',
    signatureProp: 'Tấm vé phà cũ giấu trong túi áo',
    debutScene: 'Scene 06 (Bữa cơm)',
    backstory: 'Mất một mảng ký ức về đêm gia đình rời quê đột ngột 4 năm trước.',
    want: 'Tìm hiểu vì sao hai mẹ con luôn phải chuyển trọ mỗi khi có người hỏi thăm quê cũ.',
    need: 'Chấp nhận quá khứ và thấu hiểu nỗi đau của mẹ.',
    fatalFlaw: 'Ám ảnh tự trách bản thân là nguyên nhân bi kịch.',
    fear: 'Sự im lặng của mẹ đồng nghĩa với việc chính mình đã gây ra tội lỗi.',
    motivation: 'Đi tìm mảnh ghép sự thật bị đánh cắp trong ký ức.',
    secret: 'Út đã lặng lẽ giữ lại tấm vé phà cũ tìm thấy trong túi áo mưa của mẹ.',
    arc: 'Từ đứa trẻ sống trong nghi hoặc trở thành người đủ bản lĩnh đối diện với sự thật.',
    relationships: [
      {
        targetCharacterId: 'char_lanh',
        relationLabel: 'Con — Mẹ',
        tensionNote: 'Vừa thương mẹ vất vả, vừa bức bối trước những điều mẹ giấu kín.',
      },
    ],
    keyDynamics: [
      {
        targetCharacterId: 'char_lanh',
        targetName: 'Lành',
        note: 'Vừa thương mẹ, vừa âm thầm truy tìm nguồn gốc vết sẹo và tấm vé phà.',
        frictionTag: 'Confidant',
      },
    ],
    featuredSceneIds: ['sc_06'],
  };

  const locPhongTro: ScreenplayLocation = {
    id: 'loc_phong_tro',
    name: 'Phòng trọ',
    intExt: 'INT.',
    defaultTime: 'ĐÊM',
    spatialContext: 'Tầng 2 khu tập thể cũ ven đường tàu, diện tích 18m², hành lang hẹp.',
    architecture: 'Tường vôi vàng bong tróc, cửa sổ gỗ nhìn ra mái tôn lấp loáng nước mưa, bàn ăn nhỏ đặt sát máy may đạp chân.',
    lighting: 'Ánh đèn huỳnh quang 1m2 hơi chập chờn pha với ánh đèn vàng ngoài ngõ.',
    soundscape: 'Tiếng quạt máy quay lạch cạch, tiếng mưa rơi trên mái tôn và tiếng còi tàu từ xa.',
    regularCharacterIds: ['char_lanh', 'char_ut'],
    referenceImageUrl: '',
  };

  const ev1: TimelineEvent = {
    id: 'ev_01',
    act: 'Act I — Thiết lập',
    order: 1,
    timeMark: 'Tháng 10 · Tuần đầu mới chuyển đến',
    title: 'Một bữa cơm trong giai đoạn gia đình mới chuyển đến & Thiết lập thói quen sinh hoạt của hai mẹ con',
    objectiveTruth:
      'Hai mẹ con vừa chuyển tới khu trọ mới được 4 ngày sau khi bà Lành nhìn thấy người quen cũ ở chợ. Bà Lành cố giữ mâm cơm bình thường như chưa có chuyện gì.',
    audienceKnowledge:
      'Khán giả chỉ thấy một bữa cơm tối yên tĩnh nhưng nặng nề giữa hai mẹ con ở khu trọ mới, cảm nhận được sự căng thẳng ngầm qua ánh mắt Út nhìn chiếc bát.',
    secretOrTwist:
      'Chiếc bát sứt miệng trên mâm chính là vật duy nhất bà Lành mang theo từ căn nhà cũ đêm xảy ra biến cố.',
    revealTiming: 'Hồi II-B (Scene 24) khi Út mở chiếc hộp sắt dưới đáy tủ.',
    consistencyNote: 'Trong toàn bộ Hồi I, Út chưa được phép biết lý do thực sự của lần chuyển trọ thứ 3 này.',
  };

  const scene06: ScreenplayScene = {
    id: 'sc_06',
    sceneNumber: '06',
    title: 'Bữa cơm',
    act: 'Act I — Thiết lập',
    status: 'Draft',
    intExt: 'INT.',
    locationId: 'loc_phong_tro',
    locationName: 'PHÒNG TRỌ',
    timeOfDay: 'ĐÊM',
    actionDescription:
      'Tiếng mưa rả rích trên mái tôn ngoài cửa sổ. Ánh đèn ống hơi nháy nhẹ.\nNgười mẹ (Lành) lặng lẽ dọn cơm ra chiếc bàn gỗ thấp. Đứa con (Út) ngồi bó gối, ánh mắt nhìn chằm chằm vào chiếc bát trước mặt.',
    dialogues: [
      {
        id: 'dlg_1',
        characterId: 'char_lanh',
        characterName: 'LÀNH',
        parenthetical: 'đặt đĩa cá kho xuống giữa bàn, giọng đều',
        text: 'Ăn đi con. Nguội hết bây giờ.',
      },
      {
        id: 'dlg_2',
        characterId: 'char_ut',
        characterName: 'ÚT',
        parenthetical: 'chưa cầm đũa, mắt vẫn nhìn vết mẻ trên miệng bát',
        text: 'Chỗ này... mình ở được mấy tháng hả mẹ?',
      },
      {
        id: 'dlg_3',
        characterId: 'char_lanh',
        characterName: 'LÀNH',
        parenthetical: 'khựng lại nửa nhịp, rồi gắp miếng cá bỏ vào bát con',
        text: 'Ở lâu chứ. Mẹ đóng tiền cọc ba tháng rồi.',
      },
    ],
    transition: 'CUT TO:',
    characterIds: ['char_lanh', 'char_ut'],
    relatedEventIds: ['ev_01'],
    clue: 'Vết mẻ trên chiếc bát cũ và câu trả lời né tránh ánh mắt của Lành.',
    purposeNote:
      'Một bữa cơm trong giai đoạn gia đình mới chuyển đến. Thiết lập thói quen sinh hoạt của hai mẹ con và sự im lặng nặng nề bao trùm căn phòng.',
    updatedAt: now,
  };

  return {
    id: 'proj_01',
    title: 'Những lời không chịu nói ra',
    draftSubtitle: 'Hồi I · Phân đoạn 06',
    genre: 'Psychological Drama / Mystery',
    format: 'Feature Film · 110 min',
    status: 'First Draft',
    currentTasks: 'Hoàn thiện phân đoạn bữa cơm tối (Scene 06) và cài cắm chi tiết chiếc bát cũ.',
    nextStep: 'Viết tiếp Scene 07 — Hành lang khu trọ lúc nửa đêm khi tiếng gõ cửa vang lên.',
    bible: {
      logline:
        'Trong một căn phòng trọ chật hẹp bên đường tàu, một người mẹ thợ may cố gắng chôn giấu bí mật đêm mưa 4 năm trước, nhưng chính sự im lặng bảo bọc của bà lại đẩy đứa con trai tuổi 17 vào cuộc truy tìm sự thật đầy ám ảnh.',
      synopsis:
        'Lành và Út liên tục chuyển chỗ ở suốt 4 năm qua. Tại khu trọ mới, những vật dụng quen thuộc trong các bữa cơm hằng ngày dần trở thành manh mối khiến Út khôi phục lại ký ức bị đứt đoạn. Khi người khách lạ tìm đến khu trọ, cả hai mẹ con buộc phải đối diện với điều họ chưa từng dám gọi tên.',
      themeAndMessage:
        'Sự im lặng nhân danh tình thương đôi khi còn gây tổn thương sâu hơn cả sự thật.',
      historicalSocialSetting:
        'Những năm 2010 tại một khu tập thể cũ ven đô — nơi những người lao động nhập cư sống khép kín sau những cánh cửa gỗ mỏng.',
      worldRulesAndCoreTruths:
        '1. Mọi bí mật đều để lại dấu vết vật lý trong thói quen sinh hoạt hằng ngày. 2. Không có nhân vật phản diện thuần túy — ai cũng hành động vì nỗi sợ mất đi người mình thương.',
      toneAndVisualStyle:
        'Tiết chế, giàu khoảng lặng, ánh sáng tương phản ấm/lạnh trong không gian hẹp, đối thoại ngắn mang nhiều tầng ẩn ý (Subtext).',
    },
    characters: [charLanh, charUt],
    locations: [locPhongTro],
    timeline: [ev1],
    scenes: [scene06],
    research: [
      {
        id: 'sres_01',
        category: 'Tâm lý học & Y khoa',
        title: 'Cơ chế quên phân ly (Dissociative Amnesia) sau sang chấn ở tuổi thiếu niên',
        verificationStatus: 'verified_fact',
        sourceUrl: '',
        referenceImageUrl: '',
        notes:
          'Ký ức sang chấn thường không biến mất hoàn toàn mà bị kích hoạt lại qua các giác quan quen thuộc: mùi mưa, âm thanh kim loại, hoặc một đồ vật gia đình.',
        createdAt: now - 3600 * 1000 * 5,
      },
    ],
    notes: [
      {
        id: 'snote_01',
        category: 'sudden_dialogue',
        title: 'Câu thoại của Lành ở hồi cuối',
        content: '“Người ta không sợ nói ra sự thật đâu con. Người ta chỉ sợ nói xong rồi, không còn gì để giữ nhau lại nữa.”',
        createdAt: now - 3600 * 1000 * 3,
      },
      {
        id: 'snote_02',
        category: 'open_question',
        title: 'Thời điểm Út nhìn thấy tấm vé phà cũ nên đặt ở Hồi I hay đầu Hồi II?',
        content: 'Nếu đặt ở cuối Hồi I thì tạo lực đẩy sang Hồi II mạnh hơn, nhưng cần đảm bảo Lành chưa phát hiện ra.',
        resolved: false,
        createdAt: now - 3600 * 1000 * 2,
      },
    ],
    versions: [
      {
        id: 'ver_01',
        label: 'Draft v1.0 — Khởi tạo Scene 06 (Bữa cơm)',
        createdAt: now - 3600 * 1000,
        sceneCount: 1,
        totalWords: 120,
        scenesSnapshot: [scene06],
      },
    ],
    lastOpenedSceneId: 'sc_06',
    updatedAt: now,
  };
}

export function buildInitialScreenplayState(): ScreenplayStudioState {
  const now = Date.now();
  const projChimera = buildProjectChimera(now);
  const projStarter = buildStarterProject(now);

  return {
    activeProjectId: 'proj_chimera',
    activeModule: 'characters',
    projects: [projChimera, projStarter],
  };
}
