const admin = require('firebase-admin');
const serviceAccount = require('/home/ubuntu/upload/plataforma-mentoria-mario-firebase-adminsdk-fbsvc-4e5ab9d7dc.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function limparMetasAntigas() {
  try {
    console.log('Buscando todos os alunos...');
    
    const alunosSnapshot = await db.collection('alunos').get();
    console.log(`Encontrados ${alunosSnapshot.size} alunos`);
    
    let totalMetasRemovidas = 0;
    
    for (const alunoDoc of alunosSnapshot.docs) {
      const alunoId = alunoDoc.id;
      console.log(`\nProcessando aluno: ${alunoId}`);
      
      // Buscar todas as metas do aluno
      const metasSnapshot = await db
        .collection('alunos')
        .doc(alunoId)
        .collection('metas')
        .get();
      
      console.log(`  Encontradas ${metasSnapshot.size} metas`);
      
      for (const metaDoc of metasSnapshot.docs) {
        const meta = metaDoc.data();
        
        // Remover metas diárias (tanto "pai" quanto instâncias)
        if (meta.repetirDiariamente === true) {
          console.log(`  Removendo meta diária: ${meta.nome}`);
          await metaDoc.ref.delete();
          totalMetasRemovidas++;
        }
      }
    }
    
    console.log(`\n✅ Limpeza concluída!`);
    console.log(`Total de metas removidas: ${totalMetasRemovidas}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar metas:', error);
    process.exit(1);
  }
}

limparMetasAntigas();
