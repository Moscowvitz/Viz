import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../database/database.module";
import { AiService } from "../ai/ai.service";

@Injectable()
export class StoriesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly aiService: AiService,
  ) {}

  async createStory(userId: string, title?: string) {
    const { data, error } = await this.supabase
      .from("stories")
      .insert({
        user_id: userId,
        title: title || "Untitled Story",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserStories(userId: string) {
    const { data, error } = await this.supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getStoryById(storyId: string, userId: string) {
    const { data, error } = await this.supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundException("Story not found");
    }

    return data;
  }

  async updateStory(storyId: string, userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from("stories")
      .update(updates)
      .eq("id", storyId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException("Story not found");
    }

    return data;
  }

  async deleteStory(storyId: string, userId: string) {
    await this.getStoryById(storyId, userId);

    // Clean up dependent child rows safely to avoid foreign key errors
    await this.supabase.from("narrative_connections").delete().eq("story_id", storyId);
    await this.supabase.from("entity_mentions").delete().eq("story_id", storyId);
    await this.supabase.from("narrative_elements").delete().eq("story_id", storyId);
    await this.supabase.from("story_moments").delete().eq("story_id", storyId);
    await this.supabase.from("ai_suggestions").delete().eq("story_id", storyId);
    await this.supabase.from("raw_narrations").delete().eq("story_id", storyId);

    const { error } = await this.supabase
      .from("stories")
      .delete()
      .eq("id", storyId)
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true, id: storyId };
  }

  async brainstormStoryOptions(storyId: string, userId: string) {
    await this.getStoryById(storyId, userId);

    // Fetch context for AI
    const { data: entities } = await this.supabase
      .from("narrative_elements")
      .select("name, element_type, attributes")
      .eq("story_id", storyId);

    const { data: moments } = await this.supabase
      .from("story_moments")
      .select("title, description")
      .eq("story_id", storyId)
      .order("timeline_position", { ascending: false })
      .limit(10);

    return this.aiService.brainstormStoryTheme({
      entities: entities || [],
      moments: moments || [],
    });
  }

  async getStoryElements(storyId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("narrative_elements")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }

  async getStoryTimeline(storyId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("story_moments")
      .select("*")
      .eq("story_id", storyId)
      .order("timeline_position", { ascending: true });

    if (error) throw error;
    return data;
  }

  async getStoryConnections(storyId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("narrative_connections")
      .select("*")
      .eq("story_id", storyId);

    if (error) throw error;
    return data;
  }

  async getStoryMentions(storyId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("entity_mentions")
      .select("*")
      .eq("story_id", storyId);

    if (error) throw error;
    return data;
  }

  async updateStoryElement(
    storyId: string,
    elementId: string,
    userId: string,
    updates: any,
  ) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("narrative_elements")
      .update(updates)
      .eq("id", elementId)
      .eq("story_id", storyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createStoryElement(storyId: string, userId: string, payload: any) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("narrative_elements")
      .insert({
        story_id: storyId,
        name: payload.name?.trim() || "Untitled Entity",
        element_type: payload.element_type || "character",
        attributes: payload.attributes || {},
        confidence_score: payload.confidence_score ?? 1.0,
        status: payload.status || "confirmed",
        user_confirmed: payload.user_confirmed !== undefined ? payload.user_confirmed : true,
        visual_url: payload.visual_url || payload.attributes?.visual_url || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteStoryElement(storyId: string, elementId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    await this.supabase
      .from("narrative_connections")
      .delete()
      .eq("story_id", storyId)
      .or(`from_id.eq.${elementId},to_id.eq.${elementId}`);
    await this.supabase
      .from("entity_mentions")
      .delete()
      .eq("story_id", storyId)
      .eq("element_id", elementId);
    const { error } = await this.supabase
      .from("narrative_elements")
      .delete()
      .eq("id", elementId)
      .eq("story_id", storyId);
    if (error) throw error;
    return { success: true, id: elementId };
  }

  async generateElementVisual(storyId: string, elementId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    const { data: element, error: fetchErr } = await this.supabase
      .from("narrative_elements")
      .select("*")
      .eq("id", elementId)
      .eq("story_id", storyId)
      .single();
    if (fetchErr || !element) throw new Error("Element not found");

    const visualUrl = await this.aiService.generateEntityVisual(
      element.name,
      element.element_type,
      element.attributes?.description || "",
      element.attributes?.traits || [],
    );

    const updatedAttributes = {
      ...(element.attributes || {}),
      visual_url: visualUrl,
    };

    const { data: updated, error: updateErr } = await this.supabase
      .from("narrative_elements")
      .update({
        visual_url: visualUrl,
        attributes: updatedAttributes,
      })
      .eq("id", elementId)
      .eq("story_id", storyId)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return updated;
  }

  async createStoryConnection(storyId: string, userId: string, payload: any) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("narrative_connections")
      .insert({
        story_id: storyId,
        from_id: payload.from_id,
        to_id: payload.to_id,
        connection_type: payload.connection_type || "related_to",
        description: payload.description || "",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateStoryConnection(
    storyId: string,
    connId: string,
    userId: string,
    updates: any,
  ) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("narrative_connections")
      .update(updates)
      .eq("id", connId)
      .eq("story_id", storyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteStoryConnection(
    storyId: string,
    connId: string,
    userId: string,
  ) {
    await this.getStoryById(storyId, userId);
    const { error } = await this.supabase
      .from("narrative_connections")
      .delete()
      .eq("id", connId)
      .eq("story_id", storyId);
    if (error) throw error;
    return { success: true, id: connId };
  }

  async updateStoryMoment(
    storyId: string,
    momentId: string,
    userId: string,
    updates: any,
  ) {
    await this.getStoryById(storyId, userId);
    const { data, error } = await this.supabase
      .from("story_moments")
      .update(updates)
      .eq("id", momentId)
      .eq("story_id", storyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteStoryMoment(storyId: string, momentId: string, userId: string) {
    await this.getStoryById(storyId, userId);
    const { error } = await this.supabase
      .from("story_moments")
      .delete()
      .eq("id", momentId)
      .eq("story_id", storyId);
    if (error) throw error;
    return { success: true };
  }

  async generateMomentLabel(
    storyId: string,
    momentId: string,
    userId: string,
  ) {
    await this.getStoryById(storyId, userId);
    
    // Get the moment and its context
    const { data: moment } = await this.supabase
      .from("story_moments")
      .select("*")
      .eq("id", momentId)
      .single();

    if (!moment) throw new NotFoundException("Moment not found");

    // Get narration context
    const { data: narration } = moment.created_from_narration
      ? await this.supabase
          .from("raw_narrations")
          .select("*")
          .eq("id", moment.created_from_narration)
          .single()
      : { data: null };

    // Generate improved title and description using analysis
    const context = {
      recentEvents: [{ title: moment.title, description: moment.description }],
    };

    try {
      const analysis = await this.aiService.analyzeNarration(
        narration?.content || moment.title,
        context,
      );

      // Extract title and description from AI analysis
      let newTitle = moment.title;
      let newDescription = moment.description;

      // Use event title and description if available
      if (analysis.extracted?.events && analysis.extracted.events.length > 0) {
        const event = analysis.extracted.events[0];
        newTitle = event.title;
        newDescription = event.description;
      }

      // Update moment with AI-generated labels
      const { data: updated, error } = await this.supabase
        .from("story_moments")
        .update({
          title: newTitle,
          description: newDescription,
        })
        .eq("id", momentId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      // If AI generation fails, return original moment
      return moment;
    }
  }

  async interviewStoryCharacter(
    storyId: string,
    characterId: string,
    userId: string,
    prompt: string,
  ) {
    await this.getStoryById(storyId, userId);

    const { data: character } = await this.supabase
      .from("narrative_elements")
      .select("*")
      .eq("id", characterId)
      .single();

    if (!character) throw new NotFoundException("Character not found");

    // Fetch recent moments for context
    const { data: moments } = await this.supabase
      .from("story_moments")
      .select("title, description")
      .eq("story_id", storyId)
      .order("timeline_position", { ascending: false })
      .limit(5);

    return this.aiService.simulateCharacterDialogue(
      character.name,
      character.attributes,
      prompt,
      { moments: moments || [] },
    );
  }

  async refreshCharacterDescription(
    storyId: string,
    characterId: string,
    userId: string,
  ) {
    await this.getStoryById(storyId, userId);

    const { data: character } = await this.supabase
      .from("narrative_elements")
      .select("*")
      .eq("id", characterId)
      .eq("story_id", storyId)
      .eq("element_type", "character")
      .single();

    if (!character) throw new NotFoundException("Character not found");

    const [{ data: moments }, { data: narrations }] = await Promise.all([
      this.supabase
        .from("story_moments")
        .select("title, description, narrative_weight")
        .eq("story_id", storyId)
        .contains("characters_involved", [characterId])
        .order("timeline_position", { ascending: false })
        .limit(8),
      this.supabase
        .from("raw_narrations")
        .select("content, sequence_number")
        .eq("story_id", storyId)
        .order("sequence_number", { ascending: false })
        .limit(8),
    ]);

    const description = await this.aiService.refreshCharacterDescription(
      character.name,
      character.attributes,
      { moments: moments || [], narrations: narrations || [] },
    );

    const { data: updated, error } = await this.supabase
      .from("narrative_elements")
      .update({
        attributes: {
          ...(character.attributes || {}),
          description,
        },
      })
      .eq("id", characterId)
      .eq("story_id", storyId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  async mergeEntities(
    storyId: string,
    userId: string,
    sourceId: string,
    targetId: string,
  ) {
    if (sourceId === targetId) return; // Cannot merge into self

    await this.getStoryById(storyId, userId);

    // 1. Move Mentions
    await this.supabase
      .from("entity_mentions")
      .update({ element_id: targetId })
      .eq("element_id", sourceId);

    // 2. Update Moments (characters_involved Array)
    const { data: moments } = await this.supabase
      .from("story_moments")
      .select("id, characters_involved")
      .contains("characters_involved", [sourceId]);

    if (moments) {
      for (const m of moments) {
        const newIds = new Set(m.characters_involved);
        newIds.delete(sourceId);
        newIds.add(targetId);
        await this.supabase
          .from("story_moments")
          .update({ characters_involved: Array.from(newIds) })
          .eq("id", m.id);
      }
    }

    // 3. Update Connections (From)
    const { data: fromConns } = await this.supabase
      .from("narrative_connections")
      .select("*")
      .eq("from_id", sourceId);

    if (fromConns) {
      for (const conn of fromConns) {
        const { data: existing } = await this.supabase
          .from("narrative_connections")
          .select("id")
          .eq("from_id", targetId)
          .eq("to_id", conn.to_id)
          .single();

        if (existing) {
          await this.supabase
            .from("narrative_connections")
            .delete()
            .eq("id", conn.id);
        } else {
          await this.supabase
            .from("narrative_connections")
            .update({ from_id: targetId })
            .eq("id", conn.id);
        }
      }
    }

    // 4. Update Connections (To)
    const { data: toConns } = await this.supabase
      .from("narrative_connections")
      .select("*")
      .eq("to_id", sourceId);

    if (toConns) {
      for (const conn of toConns) {
        const { data: existing } = await this.supabase
          .from("narrative_connections")
          .select("id")
          .eq("from_id", conn.from_id)
          .eq("to_id", targetId)
          .single();

        if (existing) {
          await this.supabase
            .from("narrative_connections")
            .delete()
            .eq("id", conn.id);
        } else {
          await this.supabase
            .from("narrative_connections")
            .update({ to_id: targetId })
            .eq("id", conn.id);
        }
      }
    }

    // 5. Update Suggestions & Delete Source
    await this.supabase
      .from("ai_suggestions")
      .update({ confirmed_item_id: targetId })
      .eq("confirmed_item_id", sourceId);

    await this.supabase.from("narrative_elements").delete().eq("id", sourceId);

    return { success: true };
  }
}
