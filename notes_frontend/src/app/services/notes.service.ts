import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Note } from '../models/note.model';

const STORAGE_KEY = 'notes_app_data_v1';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private notesSignal = signal<Note[]>(this.load());
  notes = computed(() => this.notesSignal());
  selectedId = signal<string | null>(null);
  selectedNote = computed(() => {
    const id = this.selectedId();
    return this.notesSignal().find(n => n.id === id) ?? null;
  });

  constructor(private router: Router) {}

  private load(): Note[] {
    if (!this.isBrowser) return [];
    try {
      const raw = (typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage !== 'undefined')
        ? (globalThis as any).localStorage.getItem(STORAGE_KEY)
        : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Note[];
      return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (!this.isBrowser) return;
    try {
      if (typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage !== 'undefined') {
        (globalThis as any).localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notesSignal()));
      }
    } catch {
      // Silently ignore quota or serialization errors.
    }
  }

  private generateId(): string {
    try {
      // Prefer Web Crypto if present
      const g: any = (typeof globalThis !== 'undefined') ? (globalThis as any) : undefined;
      if (this.isBrowser && g && typeof g.crypto !== 'undefined' && 'randomUUID' in g.crypto) {
        return g.crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    // Fallback
    return 'n_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // PUBLIC_INTERFACE
  /** Creates a new note and returns it. */
  createNote(): Note {
    const now = Date.now();
    const newNote: Note = {
      id: this.generateId(),
      title: 'Untitled note',
      content: '',
      updatedAt: now,
    };
    this.notesSignal.update((list) => [newNote, ...list]);
    this.persist();
    return newNote;
  }

  // PUBLIC_INTERFACE
  /** Updates an existing note by id. Fields not provided remain unchanged. */
  updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'content'>>): void {
    const now = Date.now();
    this.notesSignal.update((list) => {
      const next = list.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: now } : n
      );
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      return next;
    });
    this.persist();
  }

  // PUBLIC_INTERFACE
  /** Deletes a note by id. Returns true if deleted. */
  deleteNote(id: string): boolean {
    const before = this.notesSignal().length;
    this.notesSignal.update((list) => list.filter((n) => n.id !== id));
    const after = this.notesSignal().length;
    this.persist();
    if (this.selectedId() === id) {
      this.selectedId.set(null);
    }
    return after < before;
  }

  // PUBLIC_INTERFACE
  /** Gets a note by id. */
  getNoteById(id: string): Note | null {
    return this.notesSignal().find((n) => n.id === id) ?? null;
  }

  // PUBLIC_INTERFACE
  /** Sets the selected note id. */
  select(id: string | null): void {
    this.selectedId.set(id);
  }
}
