package com.example.projectwork.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "utente")
public class Utente {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int id;
	
	@Column(nullable = false, length = 100)
	private String nome;
	
	@Column(nullable = false, length = 100)
	private String cognome;
	
	@Column(nullable = false, length = 255)
	private String email;
	
	@Column(nullable = false, length = 255)
	private String password;
	
	@Column(nullable = false, length = 20)
	private String ruolo = "User";



//Costruttire di default per JPA
public Utente () {}

public Utente (String nome, String cognome, String email, String password, String ruolo) {
	this.nome = nome;
	this.cognome = cognome;
	this.email = email;
	this.password = password;
	this.ruolo = ruolo;
}

//Getter e Setter
public Integer getId() {return id;}
public void setId(Integer id) {this.id = id;}

public String getNome() {return nome;}
public void setNome(String nome) {this.nome = nome;}

public String getCognome() {return cognome;}
public void setCognome (String cognome) {this.cognome = cognome;}

public String getEmail() {return email;}
public void setEmail (String email) {this.email = email;}

public String getPassword() {return password;}
public void setPassword(String password) {this.password = password;}

public String getRuolo() {return ruolo;}
public void setRuolo(String ruolo) {this.ruolo = ruolo;}
}