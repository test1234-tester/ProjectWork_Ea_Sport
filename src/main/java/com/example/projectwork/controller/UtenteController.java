package com.example.projectwork.controller;

import com.example.projectwork.entity.Utente;
import com.example.projectwork.repository.UtenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/utenti")
public class UtenteController {
	
	@Autowired
	private UtenteRepository utenteRepository;
	
	//1. Endpoint per verificare che il server funzioni
	@GetMapping("/test")
	public String testConnection() {
		return "Il backend Spring Boot è attivo e funzionante";
	}
	
	
	//2. Endpoint per recuperare tutti gli utenti dal database
	@GetMapping
	public List<Utente> getAllUtenti() {
		return utenteRepository.findAll();
	}

	//3. Endpoint per creare utente di prova tramite Post
	@PostMapping
	public ResponseEntity<Utente> createUtente (@RequestBody Utente utente){
		Utente nuovoUtente = utenteRepository.save(utente);
		return ResponseEntity.ok(nuovoUtente);
	}
}
