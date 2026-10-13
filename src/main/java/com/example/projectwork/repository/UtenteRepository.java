package com.example.projectwork.repository;

import com.example.projectwork.entity.Utente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

//Repository che contiene tutti i metodi crud standard

@Repository
public interface UtenteRepository extends JpaRepository<Utente, Integer>{

	//Metodo personalizzato automatico gestito da Spring Data JPA
	Optional<Utente> findByEmail(String email);
	
	//Verifica se un'email esiste già
	boolean existsByEmail (String email);
}

