package com.example.projectwork.dto;

import com.example.projectwork.dto.UtenteDTO;
import com.example.projectwork.entity.Utente;
import java.util.List;

public interface UtenteService {
    List<UtenteDTO> findAll();
    UtenteDTO findById(Integer id);
    UtenteDTO create(Utente utente);
    UtenteDTO update(Integer id, Utente utente);
    void delete(Integer id);
}
