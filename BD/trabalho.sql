create database ponto;

use ponto;

create table cadastro(
	id int primary key auto_increment,
    nome varchar(100) not null,
	endereco    VARCHAR(200),
	numero      VARCHAR(20),
	bairro      VARCHAR(80),
	lat DECIMAL(9,6) NOT NULL,
	lng DECIMAL(9,6) NOT NULL,
	cep         VARCHAR(12),
	celular     VARCHAR(60),
	horario     VARCHAR(60),
	materiais   JSON NOT NULL, 
	observacoes TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


show databases;