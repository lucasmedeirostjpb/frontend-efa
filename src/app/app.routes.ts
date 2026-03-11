import { Routes } from '@angular/router';
import { MetaList } from './modules/meta/components/meta-list/meta-list';
import { MetaImportacaoComponent } from './modules/meta/components/meta-importacao/meta-importacao.component';
import { digovGuard } from './core/guards/digov.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'metas', pathMatch: 'full' },
    { path: 'metas', component: MetaList },
    { path: 'metas/importar', component: MetaImportacaoComponent, canActivate: [digovGuard] }
];

