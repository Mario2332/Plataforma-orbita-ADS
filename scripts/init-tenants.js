/**
 * Script para inicializar tenants no Firestore
 * Execute com: node scripts/init-tenants.js [projeto]
 * Projetos: orbita, free
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações dos tenants
const tenantOrbita = {
  slug: 'orbita',
  dominios: ['localhost', 'plataforma-orbita.web.app', 'plataforma-orbita.firebaseapp.com'],
  dominioPrincipal: 'plataforma-orbita.web.app',
  plano: 'white-label',
  status: 'ativo',
  branding: {
    logo: '/logo.png',
    corPrimaria: '#10b981',
    corPrimariaHover: '#059669',
    corSecundaria: '#14b8a6',
    nomeExibicao: 'Plataforma Órbita',
  },
  features: {
    estudos: true,
    cronograma: true,
    cronogramaDinamico: true,
    metricas: true,
    metas: true,
    simulados: true,
    redacoes: true,
    diarioBordo: true,
    planoAcao: true,
    autodiagnostico: true,
    mentoria: true,
    relatoriosAvancados: true,
    exportacaoPDF: true,
    integracaoCalendario: true,
  },
  ads: {
    exibirAnuncios: false,
  },
  criadoEm: admin.firestore.FieldValue.serverTimestamp(),
  atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
};

const tenantFree = {
  slug: 'orbita-free',
  dominios: ['orbita-free.web.app', 'orbita-free.firebaseapp.com', 'orbitafree.com.br'],
  dominioPrincipal: 'orbita-free.web.app',
  plano: 'free',
  status: 'ativo',
  branding: {
    logo: '/logo.png',
    corPrimaria: '#10b981',
    corPrimariaHover: '#059669',
    corSecundaria: '#14b8a6',
    nomeExibicao: 'Órbita Estudos',
  },
  features: {
    estudos: true,
    cronograma: true,
    cronogramaDinamico: false,
    metricas: true,
    metas: true,
    simulados: true,
    redacoes: true,
    diarioBordo: true,
    planoAcao: false,
    autodiagnostico: false,
    mentoria: false,
    relatoriosAvancados: false,
    exportacaoPDF: false,
    integracaoCalendario: false,
  },
  ads: {
    exibirAnuncios: true,
    googleAdsClientId: '', // Preencher após aprovação do AdSense
    slots: {
      header: '',
      sidebar: '',
      inContent: '',
      footer: '',
    },
  },
  criadoEm: admin.firestore.FieldValue.serverTimestamp(),
  atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
};

async function initTenant(project) {
  let serviceAccountPath;
  let tenant;
  
  if (project === 'orbita' || project === 'plataforma-orbita') {
    serviceAccountPath = '/home/ubuntu/upload/plataforma-orbita-firebase-adminsdk-fbsvc-3c844434df.json';
    tenant = tenantOrbita;
    console.log('Inicializando tenant para: plataforma-orbita');
  } else if (project === 'free' || project === 'orbita-free') {
    serviceAccountPath = '/home/ubuntu/upload/orbita-free-firebase-adminsdk-fbsvc-41354821ba.json';
    tenant = tenantFree;
    console.log('Inicializando tenant para: orbita-free');
  } else {
    console.error('Projeto inválido. Use: orbita ou free');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();
    
    // Criar documento do tenant
    const tenantRef = db.collection('tenants').doc(tenant.slug);
    await tenantRef.set(tenant, { merge: true });
    
    console.log(`✅ Tenant '${tenant.slug}' criado/atualizado com sucesso!`);
    console.log(`   Nome: ${tenant.branding.nomeExibicao}`);
    console.log(`   Plano: ${tenant.plano}`);
    console.log(`   Domínios: ${tenant.dominios.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Erro ao inicializar tenant:', error);
    process.exit(1);
  }
}

// Executar
const project = process.argv[2] || 'orbita';
initTenant(project).then(() => process.exit(0));
