/**
 * BUS-Tickets - Offline Action Queue
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { database } from './database';

export type ActionType =
  | 'CREATE_BOOKING'
  | 'CANCEL_TICKET'
  | 'UPDATE_PROFILE'
  | 'CHECK_IN';

export type EntityType = 'ticket' | 'booking' | 'user';

export interface QueuedAction {
  id: number;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: number | null;
  payload: string;
  created_at: number;
  retry_count: number;
  last_error: string | null;
}

export interface ActionPayload {
  [key: string]: unknown;
}

const MAX_RETRIES = 3;

class OfflineQueue {
  /**
   * Add action to queue
   */
  async enqueue(
    actionType: ActionType,
    entityType: EntityType,
    entityId: number | null,
    payload: ActionPayload
  ): Promise<number> {
    const db = await database.getDb();

    const result = await db.runAsync(
      `INSERT INTO offline_queue (
        action_type, entity_type, entity_id, payload, created_at, retry_count
      ) VALUES (?, ?, ?, ?, ?, 0)`,
      [actionType, entityType, entityId, JSON.stringify(payload), Date.now()]
    );

    console.log(`Action queued: ${actionType} for ${entityType}:${entityId}`);
    return result.lastInsertRowId;
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<QueuedAction[]> {
    const db = await database.getDb();

    return db.getAllAsync<QueuedAction>(
      `SELECT * FROM offline_queue
       WHERE retry_count < ?
       ORDER BY created_at ASC`,
      [MAX_RETRIES]
    );
  }

  /**
   * Get pending action count
   */
  async getPendingCount(): Promise<number> {
    const db = await database.getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM offline_queue WHERE retry_count < ?',
      [MAX_RETRIES]
    );
    return result?.count || 0;
  }

  /**
   * Mark action as completed (remove from queue)
   */
  async complete(actionId: number): Promise<void> {
    const db = await database.getDb();
    await db.runAsync('DELETE FROM offline_queue WHERE id = ?', [actionId]);
    console.log(`Action completed: ${actionId}`);
  }

  /**
   * Mark action as failed (increment retry count)
   */
  async fail(actionId: number, error: string): Promise<void> {
    const db = await database.getDb();
    await db.runAsync(
      `UPDATE offline_queue
       SET retry_count = retry_count + 1, last_error = ?
       WHERE id = ?`,
      [error, actionId]
    );
    console.log(`Action failed: ${actionId} - ${error}`);
  }

  /**
   * Get failed actions (exceeded max retries)
   */
  async getFailedActions(): Promise<QueuedAction[]> {
    const db = await database.getDb();

    return db.getAllAsync<QueuedAction>(
      `SELECT * FROM offline_queue
       WHERE retry_count >= ?
       ORDER BY created_at ASC`,
      [MAX_RETRIES]
    );
  }

  /**
   * Retry failed action
   */
  async retry(actionId: number): Promise<void> {
    const db = await database.getDb();
    await db.runAsync(
      `UPDATE offline_queue
       SET retry_count = 0, last_error = NULL
       WHERE id = ?`,
      [actionId]
    );
  }

  /**
   * Clear all completed actions
   */
  async clearCompleted(): Promise<void> {
    const db = await database.getDb();
    await db.runAsync('DELETE FROM offline_queue WHERE retry_count >= ?', [
      MAX_RETRIES,
    ]);
  }

  /**
   * Clear all actions
   */
  async clearAll(): Promise<void> {
    const db = await database.getDb();
    await db.runAsync('DELETE FROM offline_queue');
  }

  /**
   * Get action by ID
   */
  async getAction(actionId: number): Promise<QueuedAction | null> {
    const db = await database.getDb();
    return db.getFirstAsync<QueuedAction>(
      'SELECT * FROM offline_queue WHERE id = ?',
      [actionId]
    );
  }
}

export const offlineQueue = new OfflineQueue();
