import { Component, OnDestroy, OnInit, effect, inject, signal, EffectRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, isPlatformBrowser } from '@angular/common';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss',
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notesSvc = inject(NotesService);

  note = signal<Note | null>(null);
  // Internal signals
  private titleSig = signal('');
  private contentSig = signal('');
  saved = signal(true);

  // Timer id for simple debounce; typed as ReturnType<typeof setTimeout> for correctness
  // Use a cross-platform timeout handle type
  private saveTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  private cleanupEffect?: EffectRef;

  // Bridge properties for ngModel two-way binding (template drives get/set on plain fields)
  get title(): string {
    return this.titleSig();
  }
  set title(v: string) {
    this.titleSig.set(v ?? '');
  }

  get content(): string {
    return this.contentSig();
  }
  set content(v: string) {
    this.contentSig.set(v ?? '');
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.note.set(null);
        return;
      }
      const found = this.notesSvc.getNoteById(id);
      if (!found) {
        // If not found, navigate to list
        this.router.navigate(['/notes']);
        return;
      }
      this.notesSvc.select(id);
      this.note.set(found);
      this.title = found.title;
      this.content = found.content;
      this.saved.set(true);
    });

    // auto-save effect when title/content changes
    const dispose = effect(() => {
      const n = this.note();
      const t = this.titleSig();
      const c = this.contentSig();

      if (!n) return;
      const titleValue = (t || '').trim();
      this.saved.set(false);
      if (this.saveTimer) {
        globalThis.clearTimeout(this.saveTimer);
      }
      this.saveTimer = globalThis.setTimeout(() => {
        this.notesSvc.updateNote(n.id, { title: titleValue || 'Untitled note', content: c });
        this.saved.set(true);
      }, 300) as ReturnType<typeof globalThis.setTimeout>;
    });
    this.cleanupEffect = dispose;
  }

  ngOnDestroy(): void {
    if (this.cleanupEffect) this.cleanupEffect.destroy();
    if (this.saveTimer) {
      globalThis.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  // PUBLIC_INTERFACE
  /** Deletes the current note and navigates back to list. */
  deleteCurrent() {
    const n = this.note();
    if (!n) return;
    this.notesSvc.deleteNote(n.id);
    this.router.navigate(['/notes']);
  }
}
