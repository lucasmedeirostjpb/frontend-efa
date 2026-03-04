import { Routes } from '@angular/router';
import { MetaList } from './modules/meta/components/meta-list/meta-list';
import { MetaForm } from './modules/meta/components/meta-form/meta-form';
import { coordenadorGuard } from './core/guards/coordenador.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'metas', pathMatch: 'full' },
    { path: 'metas', component: MetaList },
    { path: 'metas/nova', component: MetaForm, canActivate: [coordenadorGuard] },
    { path: 'metas/editar/:id', component: MetaForm, canActivate: [coordenadorGuard] },
];
