package com.example.projectwork.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "iscrizione", uniqueConstraints = {
    @UniqueConstraint(name = "uq_utente_torneo_iscrizione", columnNames = {"utente_id", "torneo_id"})
})
public class Iscrizione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "data_iscrizione", updatable = false)
    private LocalDateTime dataIscrizione;

    @Column(nullable = false, length = 20)
    private String stato = "Confermata";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utente_id", nullable = false)
    private Utente utente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "torneo_id", nullable = false)
    private Torneo torneo;

    public Iscrizione() {}

    @PrePersist
    public void prePersist() {
        if (this.dataIscrizione == null) {
            this.dataIscrizione = LocalDateTime.now();
        }
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDateTime getDataIscrizione() { return dataIscrizione; }
    public void setDataIscrizione(LocalDateTime dataIscrizione) { this.dataIscrizione = dataIscrizione; }

    public String getStato() { return stato; }
    public void setStato(String stato) { this.stato = stato; }

    public Utente getUtente() { return utente; }
    public void setUtente(Utente utente) { this.utente = utente; }

    public Torneo getTorneo() { return torneo; }
    public void setTorneo(Torneo torneo) { this.torneo = torneo; }
}