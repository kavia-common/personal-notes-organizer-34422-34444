import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NotesListComponent } from './components/notes-list/notes-list.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { NotesService } from './services/notes.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NotesListComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Personal Notes';
  private router = inject(Router);
  notesSvc = inject(NotesService);

  showDeleteDialog = signal(false);
  candidateId: string | null = null;

  addNote() {
    const note = this.notesSvc.createNote();
    this.notesSvc.select(note.id);
    this.router.navigate(['/notes', note.id]);
  }

  requestDelete(note: { id: string }) {
    this.candidateId = note.id;
    this.showDeleteDialog.set(true);
  }

  confirmDelete() {
    if (this.candidateId) {
      this.notesSvc.deleteNote(this.candidateId);
      this.candidateId = null;
    }
    this.showDeleteDialog.set(false);
  }

  cancelDelete() {
    this.candidateId = null;
    this.showDeleteDialog.set(false);
  }
}
