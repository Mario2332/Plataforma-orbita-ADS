/**
 * Script para importar conteúdo base do JSON para o Firestore
 * Execução única para popular a collection conteudos_base
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function importBaseContent() {
  try {
    console.log("📂 Carregando JSON...");
    
    // Carregar JSON
    const jsonPath = path.join(__dirname, "..", "study-content-data.json");
    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const baseData = JSON.parse(jsonContent);
    
    console.log(`✅ JSON carregado: ${Object.keys(baseData).length} matérias`);
    
    // Importar para Firestore
    const batch = db.batch();
    let count = 0;
    
    for (const [materiaKey, materiaData] of Object.entries(baseData)) {
      const docRef = db.collection("conteudos_base").doc(materiaKey);
      batch.set(docRef, materiaData);
      count++;
      console.log(`  📝 ${materiaKey}: ${(materiaData as any).topics?.length || 0} tópicos`);
    }
    
    console.log(`\n🚀 Salvando ${count} matérias no Firestore...`);
    await batch.commit();
    
    console.log("✅ Importação concluída com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`  - Matérias importadas: ${count}`);
    console.log(`  - Collection: conteudos_base`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro na importação:", error);
    process.exit(1);
  }
}

importBaseContent();
