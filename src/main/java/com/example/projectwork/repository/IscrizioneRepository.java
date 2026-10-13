package com.example.projectwork.repository;

import com.example.projectwork.entity.Iscrizione;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IscrizioneRepository extends JpaRepository<Iscrizione, Integer>{
	
	//Trova tutte le iscrizioni di uno specifico utente
	List<Iscrizione> findByUtenteId(Integer utenteId);
	
	//Trova tutte le iscrizioni di uno specifico torneo
	List<Iscrizione> findByTorneoId(Integer torneoId);
	
	//Verifica se l'utente si è già iscritto allo stesso torneo
	boolean existisByUtenteIdAndTorneoId(Integer utenteId, Integer torneoId);

}
