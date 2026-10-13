-- 1. PULIZIA STRUTTURE PRECEDENTI
DROP TABLE IF EXISTS iscrizione CASCADE;
DROP TABLE IF EXISTS risultato CASCADE;
DROP TABLE IF EXISTS torneo CASCADE;
DROP TABLE IF EXISTS utente CASCADE;
DROP TABLE IF EXISTS faq CASCADE;

DROP TYPE IF EXISTS ruolo_enum CASCADE;
DROP TYPE IF EXISTS stato_torneo_enum CASCADE;

-- 2. TABELLA UTENTE
CREATE TABLE utente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    ruolo VARCHAR(20) NOT NULL DEFAULT 'User' CHECK (ruolo IN ('Admin', 'User'))
);

-- 3. TABELLA TORNEO
CREATE TABLE torneo (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descrizione TEXT,
    gioco VARCHAR(100) NOT NULL,
    posti_max INT NOT NULL DEFAULT 32,
    stato VARCHAR(20) NOT NULL DEFAULT 'Aperto' CHECK (stato IN ('Aperto', 'In Corso', 'Chiuso', 'Concluso', 'Cancellato')),
    data_inizio DATE NOT NULL,
    data_fine DATE NOT NULL
);

-- 4. TABELLA ISCRIZIONE
CREATE TABLE iscrizione (
    id SERIAL PRIMARY KEY,
    data_iscrizione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stato VARCHAR(20) NOT NULL DEFAULT 'Confermata' CHECK (stato IN ('Confermata', 'In_Attesa')),
    utente_id INT NOT NULL,
    torneo_id INT NOT NULL,
    CONSTRAINT fk_iscrizione_utente FOREIGN KEY (utente_id) REFERENCES utente (id) ON DELETE CASCADE,
    CONSTRAINT fk_iscrizione_torneo FOREIGN KEY (torneo_id) REFERENCES torneo (id) ON DELETE CASCADE,
    CONSTRAINT uq_utente_torneo_iscrizione UNIQUE (utente_id, torneo_id)
);

-- 5. TABELLA RISULTATO
CREATE TABLE risultato (
    id SERIAL PRIMARY KEY,
    punti INT NOT NULL DEFAULT 0,
    posizione INT,
    vittorie INT NOT NULL DEFAULT 0,
    sconfitte INT NOT NULL DEFAULT 0,
    utente_id INT NOT NULL,
    torneo_id INT NOT NULL,
    CONSTRAINT fk_risultato_utente FOREIGN KEY (utente_id) REFERENCES utente (id) ON DELETE CASCADE,
    CONSTRAINT fk_risultato_torneo FOREIGN KEY (torneo_id) REFERENCES torneo (id) ON DELETE CASCADE,
    CONSTRAINT uq_utente_torneo_risultato UNIQUE (utente_id, torneo_id)
);

-- 6. TABELLA FAQ
CREATE TABLE faq (
    id SERIAL PRIMARY KEY,
    domanda TEXT NOT NULL,
    risposta TEXT NOT NULL
);