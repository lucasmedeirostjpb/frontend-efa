import { Routes } from '@angular/router';
import { MetaList } from './modules/meta/components/meta-list/meta-list';
import { coordenadorGuard } from './core/guards/coordenador.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'metas', pathMatch: 'full' },
    { path: 'metas', component: MetaList }
];

