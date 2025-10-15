import { Component, inject, output } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  templateUrl: './notes-list.component.html',
  styleUrl: './notes-list.component.scss',
})
export class NotesListComponent {
  private notesSvc = inject(NotesService);

  notes = this.notesSvc.notes;
  selectedId = this.notesSvc.selectedId;

  // Emits when request to delete a note happens
  delete = output<Note>();

  trackById = (_: number, n: Note) => n.id;

  onDelete(note: Note) {
    this.delete.emit(note);
  }

  select(note: Note) {
    this.selectedId.set(note.id);
  }
}
