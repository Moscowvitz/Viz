// In-memory Supabase mock client for Story Engine in AI Studio
export interface MockTableData {
  [tableName: string]: any[];
}

function createInitialData(): MockTableData {
  const storyId = 'story-sample-001';
  const userId = 'demo-user-123';
  const char1Id = 'char-001';
  const char2Id = 'char-002';
  const locId = 'loc-001';
  const nar1Id = 'nar-001';
  const nar2Id = 'nar-002';

  return {
    profiles: [
      {
        id: userId,
        display_name: 'Story Creator',
        avatar_url: null,
        xp: 120,
        level: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    stories: [
      {
        id: storyId,
        user_id: userId,
        title: 'The Whispering Spire of Aethelgard',
        description: 'An ancient obsidian tower awakens in the mist, echoing voices of forgotten astronomers.',
        genre: 'Fantasy Mystery',
        language: 'en',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    raw_narrations: [
      {
        id: nar1Id,
        story_id: storyId,
        content: 'Lady Karen stepped into the obsidian threshold of the Whispering Spire, her lantern beam cutting through centuries of stagnant dust.',
        sequence_number: 0,
        listener_response: 'The atmosphere grows thick with mystery as Karen enters the forgotten tower.',
        extracted: {
          characters: [{ name: 'Lady Karen', confidence: 0.95, mention_phrase: 'Lady Karen' }],
          locations: [{ name: 'The Whispering Spire', confidence: 0.9, mention_phrase: 'Whispering Spire' }],
          events: [{ title: 'Crossing the Threshold', description: 'Karen breaches the ancient tower.', characters_involved: ['Lady Karen'], importance: 7 }],
          connections: [],
        },
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: nar2Id,
        story_id: storyId,
        content: 'From the shadows, Lord Ronald emerged, his bronze gauntlet clutching a fractured star-chart. "You should not have returned, Karen," he whispered.',
        sequence_number: 1,
        listener_response: 'A tense confrontation unfolds as Lord Ronald reveals his hidden presence.',
        extracted: {
          characters: [{ name: 'Lord Ronald', confidence: 0.95, mention_phrase: 'Lord Ronald' }],
          events: [{ title: 'The Shadow Confrontation', description: 'Ronald confronts Karen inside the spire.', characters_involved: ['Lady Karen', 'Lord Ronald'], importance: 8 }],
          connections: [{ from: 'Lord Ronald', to: 'Lady Karen', type: 'tense_rivalry', description: 'Unresolved history over the star-chart' }],
        },
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    narrative_elements: [
      {
        id: char1Id,
        story_id: storyId,
        element_type: 'character',
        name: 'Lady Karen',
        attributes: {
          traits: ['Determined', 'Analytical', 'Guarded'],
          description: 'A scholar of ancient astro-cartography seeking the missing fifth constellation.',
          current_emotion: 'Apprehensive yet resolute',
          sentiment_score: 3,
        },
        first_mentioned_in_narration: nar1Id,
        last_mentioned_in_narration: nar2Id,
        user_confirmed: true,
        confidence_score: 0.95,
        created_at: new Date(Date.now() - 3000000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: char2Id,
        story_id: storyId,
        element_type: 'character',
        name: 'Lord Ronald',
        attributes: {
          traits: ['Enigmatic', 'Bitter', 'Calculating'],
          description: 'Former keeper of the imperial archives who vanished three winters ago.',
          current_emotion: 'Defensive tension',
          sentiment_score: -2,
        },
        first_mentioned_in_narration: nar2Id,
        last_mentioned_in_narration: nar2Id,
        user_confirmed: true,
        confidence_score: 0.95,
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: locId,
        story_id: storyId,
        element_type: 'location',
        name: 'The Whispering Spire',
        attributes: {
          traits: ['Obsidian architecture', 'Acoustic echoes', 'Frozen in time'],
          description: 'A monolithic spire built of dark star-glass that hums when celestial bodies align.',
          type: 'Ancient Observatory',
        },
        first_mentioned_in_narration: nar1Id,
        last_mentioned_in_narration: nar2Id,
        user_confirmed: true,
        confidence_score: 0.9,
        created_at: new Date(Date.now() - 3000000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    story_moments: [
      {
        id: 'moment-001',
        story_id: storyId,
        title: 'Breaching the Spire',
        description: 'Lady Karen enters the obsidian threshold, unsealing doors locked for three centuries.',
        timeline_position: 0.1,
        created_from_narration: nar1Id,
        characters_involved: [char1Id],
        narrative_weight: 6,
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: 'moment-002',
        story_id: storyId,
        title: 'Meeting in the Shadows',
        description: 'Ronald confronts Karen with a shattered star-chart in hand.',
        timeline_position: 0.35,
        created_from_narration: nar2Id,
        characters_involved: [char1Id, char2Id],
        narrative_weight: 8,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    narrative_connections: [
      {
        id: 'conn-001',
        story_id: storyId,
        from_id: char2Id,
        to_id: char1Id,
        connection_type: 'conflicted_past',
        description: 'Former research partners separated by an arcane secret.',
        created_from_narration: nar2Id,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    entity_mentions: [
      {
        id: 'mention-001',
        story_id: storyId,
        element_id: char1Id,
        narration_id: nar1Id,
        mention_context: 'Lady Karen stepped into the obsidian threshold',
        emotional_state: { current_emotion: 'Apprehensive', sentiment_score: 2 },
        importance_in_narration: 9.5,
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: 'mention-002',
        story_id: storyId,
        element_id: char2Id,
        narration_id: nar2Id,
        mention_context: 'From the shadows, Lord Ronald emerged',
        emotional_state: { current_emotion: 'Defensive tension', sentiment_score: -2 },
        importance_in_narration: 9.5,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    ai_suggestions: [
      {
        id: 'sugg-001',
        story_id: storyId,
        narration_id: nar2Id,
        suggestion_type: 'element',
        status: 'pending',
        suggested_data: {
          name: 'Fractured Star-Chart',
          element_type: 'organization',
          attributes: {
            traits: ['Bronze relic', 'Celestial cipher'],
            description: 'A cracked astrolabe slate pointing toward an uncharted solar quadrant.',
          },
          confidence: 0.88,
          mention_phrase: 'fractured star-chart',
        },
        confirmed_item_id: null,
        created_at: new Date(Date.now() - 1700000).toISOString(),
      },
    ],
    xp_ledger: [
      {
        id: 'xp-001',
        user_id: userId,
        amount: 10,
        reason: 'Narration Submitted',
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: 'xp-002',
        user_id: userId,
        amount: 50,
        reason: 'World Building: Lady Karen',
        created_at: new Date(Date.now() - 2500000).toISOString(),
      },
    ],
  };
}

class QueryBuilder {
  private data: any[];
  private tableName: string;
  private store: MockTableData;
  private isSingle = false;
  private limitCount?: number;
  private selectedFields: string[] = ['*'];

  constructor(tableName: string, store: MockTableData) {
    this.tableName = tableName;
    this.store = store;
    if (!this.store[tableName]) {
      this.store[tableName] = [];
    }
    // Work with a shallow copy of table rows
    this.data = [...this.store[tableName]];
  }

  select(fields = '*') {
    this.selectedFields = fields.split(',').map((f) => f.trim());
    return this;
  }

  eq(column: string, value: any) {
    this.data = this.data.filter((item) => item[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.data = this.data.filter((item) => values.includes(item[column]));
    return this;
  }

  contains(column: string, values: any[]) {
    this.data = this.data.filter((item) => {
      const arr = item[column];
      if (!Array.isArray(arr)) return false;
      return values.every((v) => arr.includes(v));
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const ascending = options?.ascending !== false;
    this.data.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(recordOrRecords: any | any[]) {
    const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    const inserted = records.map((r) => ({
      id: r.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || new Date().toISOString(),
      ...r,
    }));

    this.store[this.tableName].push(...inserted);
    this.data = inserted;
    return this;
  }

  update(updates: any) {
    const idsToUpdate = new Set(this.data.map((d) => d.id));
    const tableList = this.store[this.tableName];
    const updatedList: any[] = [];

    for (let i = 0; i < tableList.length; i++) {
      if (idsToUpdate.has(tableList[i].id)) {
        tableList[i] = {
          ...tableList[i],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        updatedList.push(tableList[i]);
      }
    }
    this.data = updatedList;
    return this;
  }

  delete() {
    const idsToDelete = new Set(this.data.map((d) => d.id));
    this.store[this.tableName] = this.store[this.tableName].filter(
      (item) => !idsToDelete.has(item.id)
    );
    this.data = [];
    return this;
  }

  // Promise resolution
  then(resolve: (val: { data: any; error: any }) => any, reject?: (err: any) => any) {
    try {
      let result = this.data;

      // Handle joined fields for suggestions if requested
      if (this.tableName === 'ai_suggestions') {
        const narrations = this.store['raw_narrations'] || [];
        result = result.map((item) => {
          const nar = narrations.find((n) => n.id === item.narration_id);
          return {
            ...item,
            narration: nar ? { content: nar.content, sequence_number: nar.sequence_number } : null,
          };
        });
      }

      if (this.limitCount !== undefined) {
        result = result.slice(0, this.limitCount);
      }

      const finalData = this.isSingle ? (result.length > 0 ? result[0] : null) : result;
      return Promise.resolve(resolve({ data: finalData, error: null }));
    } catch (error) {
      if (reject) {
        return Promise.reject(reject(error));
      }
      return Promise.resolve(resolve({ data: null, error }));
    }
  }
}

export class MockSupabaseClient {
  private store: MockTableData;

  constructor() {
    this.store = createInitialData();
  }

  from(tableName: string) {
    return new QueryBuilder(tableName, this.store);
  }
}

let mockInstance: MockSupabaseClient | null = null;

export function getMockSupabaseClient(): MockSupabaseClient {
  if (!mockInstance) {
    mockInstance = new MockSupabaseClient();
  }
  return mockInstance;
}
