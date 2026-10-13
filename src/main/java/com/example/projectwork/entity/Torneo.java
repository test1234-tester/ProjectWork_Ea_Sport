package com.example.projectwork.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "torneo")
public class Torneo {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
	
	@Column(nullable = false, length = 100)
	private String nome;
	
	public Torneo() {}
	
	public Torneo(Integer id) {
		this.id = id;
	}

	public Integer getId() {return id;}
	public void setId(Integer id) {this.id = id;}
	
	public String getNome() {return nome;}
	public void setNome(String nome) {this.nome = nome;}
}
