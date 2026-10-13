package com.example.projectwork.dto;

import java.time.LocalDateTime;

public class IscrizioneDTO {

    private Integer id;
    private LocalDateTime dataIscrizione;
    private String stato;
    private Integer utenteId;
    private String nomeUtente;
    private Integer torneoId;

    public IscrizioneDTO() {}

    public IscrizioneDTO(Integer id, LocalDateTime dataIscrizione, String stato, Integer utenteId, String nomeUtente, Integer torneoId) {
        this.id = id;
        this.dataIscrizione = dataIscrizione;
        this.stato = stato;
        this.utenteId = utenteId;
        this.nomeUtente = nomeUtente;
        this.torneoId = torneoId;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDateTime getDataIscrizione() { return dataIscrizione; }
    public void setDataIscrizione(LocalDateTime dataIscrizione) { this.dataIscrizione = dataIscrizione; }

    public String getStato() { return stato; }
    public void setStato(String stato) { this.stato = stato; }

    public Integer getUtenteId() { return utenteId; }
    public void setUtenteId(Integer utenteId) { this.utenteId = utenteId; }

    public String getNomeUtente() { return nomeUtente; }
    public void setNomeUtente(String nomeUtente) { this.nomeUtente = nomeUtente; }

    public Integer getTorneoId() { return torneoId; }
    public void setTorneoId(Integer torneoId) { this.torneoId = torneoId; }
}