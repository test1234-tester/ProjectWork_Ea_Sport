const baseUrl = 'http://localhost:3000/api';

async function runTests() {
  console.log('=== INIZIO TEST SUITE BACKEND ===\n');

  try {
    // 1. REGISTRAZIONE UTENTE
    const uniqueEmail = `player_${Date.now()}@example.com`;
    console.log(`1. Test Registrazione con ${uniqueEmail}...`);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Luca',
        cognome: 'Bianchi',
        email: uniqueEmail,
        password: 'passwordSegreta123'
      })
    });
    const regData = await regRes.json();
    console.log('   Status:', regRes.status, regData.messaggio, 'ID:', regData.utente?.id);
    if (regRes.status !== 201) throw new Error('Registrazione fallita');
    const userToken = regData.token;
    const userId = regData.utente.id;

    // 2. LOGIN ADMIN
    console.log('\n2. Test Login con utente Admin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.backend@example.com',
        password: 'Password123!'
      })
    });
    let adminToken;
    if (loginRes.status === 200) {
      const loginData = await loginRes.json();
      adminToken = loginData.token;
      console.log('   Status:', loginRes.status, 'Admin ID:', loginData.utente?.id, 'Ruolo:', loginData.utente?.ruolo);
    } else {
      // Registra un nuovo admin se non presente
      console.log('   Admin non presente con quelle credenziali, creo admin temporaneo...');
      const regAdmin = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Super',
          cognome: 'Admin',
          email: `admin_${Date.now()}@test.it`,
          password: 'passwordAdmin123'
        })
      });
      const adminData = await regAdmin.json();
      adminToken = adminData.token;
      console.log('   Creato admin con ID:', adminData.utente?.id, 'Ruolo:', adminData.utente?.ruolo);
    }

    // 3. RECUPERO TORNEI
    console.log('\n3. Test Recupero Tornei (GET /api/tornei)...');
    const torneiRes = await fetch(`${baseUrl}/tornei`);
    const tornei = await torneiRes.json();
    console.log('   Status:', torneiRes.status, 'Numero tornei trovati:', tornei.length);

    // 4. CREAZIONE TORNEO DA DASHBOARD ADMIN
    console.log('\n4. Test Creazione Torneo (POST /api/admin/tornei)...');
    const createRes = await fetch(`${baseUrl}/admin/tornei`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        nome: 'Torneo Test Automatizzato',
        immagine: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        descrizione: 'Descrizione test torneo',
        gioco: 'CALCIO E-SPORTS',
        data_inizio: '2026-11-01',
        data_fine: '2026-11-05',
        modalita: 'IN SEDE',
        posti_max: 16
      })
    });
    const createdTorneo = await createRes.json();
    console.log('   Status:', createRes.status, 'ID Torneo Creato:', createdTorneo.id, 'Titolo:', createdTorneo.nome);
    if (createRes.status !== 201) throw new Error('Creazione torneo fallita');
    const torneoId = createdTorneo.id;

    // 5. MODIFICA TORNEO DA DASHBOARD (invio senza campo 'stato', esattamente come fa il form admin frontend)
    console.log('\n5. Test Modifica Torneo (PUT /api/admin/tornei/:id senza stato)...');
    const updateRes = await fetch(`${baseUrl}/admin/tornei/${torneoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id: torneoId,
        nome: 'Torneo Test Aggiornato',
        immagine: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
        descrizione: 'Descrizione aggiornata',
        gioco: 'CALCIO E-SPORTS',
        data_inizio: '2026-11-02',
        data_fine: '2026-11-06',
        modalita: 'ONLINE',
        posti_max: 32
      })
    });
    const updatedTorneo = await updateRes.json();
    console.log('   Status:', updateRes.status, 'Nuovo nome:', updatedTorneo.nome, 'Nuova modalita:', updatedTorneo.modalita);
    if (updateRes.status !== 200) throw new Error('Modifica torneo fallita');

    // 6. ISCRIZIONE AL TORNEO (POST /api/iscrizioni come fa AuthService)
    console.log('\n6. Test Iscrizione Utente al Torneo (POST /api/iscrizioni)...');
    const iscrRes = await fetch(`${baseUrl}/iscrizioni`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        utente_id: userId,
        torneo_id: torneoId,
        stato: 'Confermata'
      })
    });
    const iscrData = await iscrRes.json();
    console.log('   Status:', iscrRes.status, 'Stato Iscrizione:', iscrData.stato, 'ID Iscrizione:', iscrData.id);
    if (iscrRes.status !== 201) throw new Error('Iscrizione fallita');

    // 7. CARICAMENTO ISCRIZIONI UTENTE (GET /api/utenti/:id/iscrizioni come fa AuthService)
    console.log('\n7. Test Caricamento Iscrizioni Utente (GET /api/utenti/:id/iscrizioni)...');
    const userIscrRes = await fetch(`${baseUrl}/utenti/${userId}/iscrizioni`);
    const userIscrList = await userIscrRes.json();
    console.log('   Status:', userIscrRes.status, 'Iscrizioni trovate:', userIscrList.length);
    if (userIscrList.length === 0) throw new Error('Nessuna iscrizione trovata per l\'utente');

    // 8. ASSEGNAZIONE PUNTEGGIO DA PARTE DELL\'ADMIN (PUT /api/admin/tornei/:id/risultati/:userId)
    console.log('\n8. Test Inserimento Punteggio da Dashboard Admin...');
    const scoreRes = await fetch(`${baseUrl}/admin/tornei/${torneoId}/risultati/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        punti: 500,
        posizione: 1
      })
    });
    const scoreData = await scoreRes.json();
    console.log('   Status:', scoreRes.status, 'Messaggio:', scoreData.messaggio, 'Punti salvati:', scoreData.risultato?.punti);
    if (scoreRes.status !== 200) throw new Error('Salvataggio punteggio fallito');

    // 9. RECUPERO RISULTATI COMPLESSIVI (GET /api/risultati per la User Area)
    console.log('\n9. Test Recupero Risultati per la User Area (GET /api/risultati)...');
    const risultatiRes = await fetch(`${baseUrl}/risultati`);
    const risultati = await risultatiRes.json();
    console.log('   Status:', risultatiRes.status, 'Risultati totali nel sistema:', risultati.length);
    const myResult = risultati.find(r => r.utente_id === userId);
    console.log('   Risultato per utente test trovato:', myResult ? `Sì (Torneo: ${myResult.nome_torneo}, Punti: ${myResult.punti}, Studente: ${myResult.nome_studente})` : 'No');
    if (!myResult) throw new Error('Risultato non trovato in GET /api/risultati');

    // 10. ANNULLAMENTO ISCRIZIONE (DELETE /api/iscrizioni?utenteId=...&torneoId=...)
    console.log('\n10. Test Annullamento Iscrizione (DELETE /api/iscrizioni)...');
    const delIscrRes = await fetch(`${baseUrl}/iscrizioni?utenteId=${userId}&torneoId=${torneoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const delIscrData = await delIscrRes.json();
    console.log('    Status:', delIscrRes.status, 'Risposta:', delIscrData.message);
    if (delIscrRes.status !== 200) throw new Error('Cancellazione iscrizione fallita');

    // 11. ELIMINAZIONE TORNEO DA DASHBOARD ADMIN (DELETE /api/admin/tornei/:id)
    console.log('\n11. Test Eliminazione Torneo (DELETE /api/admin/tornei/:id)...');
    const delTorneoRes = await fetch(`${baseUrl}/admin/tornei/${torneoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const delTorneoData = await delTorneoRes.json();
    console.log('    Status:', delTorneoRes.status, 'Risposta:', delTorneoData.message);
    if (delTorneoRes.status !== 200) throw new Error('Eliminazione torneo fallita');

    console.log('\n==========================================');
    console.log(' TUTTI I 11 TEST SONO STATI SUPERATI CON SUCCESSO! ');
    console.log('==========================================');
  } catch (err) {
    console.error('\n❌ ERRORE NEL TEST:', err);
    process.exitCode = 1;
  }
}

runTests();
