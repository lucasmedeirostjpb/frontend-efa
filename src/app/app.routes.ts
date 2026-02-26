import { Routes } from '@angular/router';
import { MetaList } from './components/meta-list/meta-list';
import { MetaForm } from './components/meta-form/meta-form';

export const routes: Routes = [
    { path: '', redirectTo: 'metas', pathMatch: 'full' },
    { path: 'metas', component: MetaList },
    { path: 'metas/nova', component: MetaForm },
    { path: 'metas/editar/:id', component: MetaForm },
];
