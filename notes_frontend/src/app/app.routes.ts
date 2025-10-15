import { Routes } from '@angular/router';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'notes' },
  { path: 'notes', children: [
      { path: '', component: NoteEditorComponent }, // welcome screen in editor pane
      { path: ':id', component: NoteEditorComponent },
    ]
  },
  { path: '**', redirectTo: 'notes' },
];
