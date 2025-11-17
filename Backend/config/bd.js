import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("./Usuario.db", (err)=> {
    if(err){
        console.error("Erro ao conectar com o banco de dados", err.message)
    } else {
        console.log("Banco de dados conectado.")
    }
});

db.serialize(()=>{

    db.run(`CREATE TABLE IF NOT EXISTS Usuario (
            id_usuario      INTEGER PRIMARY KEY AUTOINCREMENT,
            nome            TEXT,
            senha           TEXT,
            num_postagens   INTEGER DEFAULT 0,
            email           TEXT,
            ft_perfil       BLOB
        )
    `);

    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE IF NOT EXISTS Historia (
            id_historia     INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario      INTEGER,
            titulo          TEXT NOT NULL,
            categoria       TEXT NOT NULL,
            conteudo        TEXT NOT NULL,
            imagem_capa     BLOB,
            num_curtidas    INTEGER DEFAULT 0,
            num_comentarios INTEGER DEFAULT 0,
            data_criacao    DATETIME DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);

    db.run(`CREATE TABLE IF NOT EXISTS Comentario (
            id_comentario   INTEGER PRIMARY KEY AUTOINCREMENT,
            id_historia     INTEGER,
            id_usuario      INTEGER,
            id_comentario_pai INTEGER DEFAULT NULL,
            conteudo        TEXT,
            data_comentario DATETIME DEFAULT (datetime('now','localtime')),
            num_curtidas    INTEGER DEFAULT 0,
            FOREIGN KEY (id_historia) REFERENCES Historia(id_historia) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (id_comentario_pai) REFERENCES Comentario(id_comentario) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);

    db.run(`CREATE TABLE IF NOT EXISTS Curtida (
            id_curtida      INTEGER PRIMARY KEY AUTOINCREMENT,
            id_historia     INTEGER,
            id_usuario      INTEGER,
            data_curtida    DATETIME DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (id_historia) REFERENCES Historia(id_historia) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
            UNIQUE(id_historia, id_usuario)
        )
    `);

    db.run(`CREATE TABLE IF NOT EXISTS Curtida_Comentario (
            id_curtida_comentario INTEGER PRIMARY KEY AUTOINCREMENT,
            id_comentario INTEGER,
            id_usuario INTEGER,
            data_curtida DATETIME DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (id_comentario) REFERENCES Comentario(id_comentario) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
        )
    `);

    db.run(`CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE NOT NULL,
            icone TEXT,
            cor     TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);



});

// MÉTODOS AUXILIARES PARA CATEGORIAS
export const CATEGORIAS = {
    CRIATURAS: 'criaturas',
    FESTAS: 'festas',
    CONHECIMENTOS: 'conhecimentos',
    MEMORIAS: 'memorias',
    COSTUMES: 'costumes',
    OUTROS: 'outros'
};

export function getCategoriaNome(categoria) {
    const nomes = {
        [CATEGORIAS.CRIATURAS]: 'Criaturas Míticas',
        [CATEGORIAS.FESTAS]: 'Festas Tradicionais',
        [CATEGORIAS.CONHECIMENTOS]: 'Conhecimentos Ancestrais',
        [CATEGORIAS.MEMORIAS]: 'Memórias & Vivências',
        [CATEGORIAS.COSTUMES]: 'Costumes & Tradições',
        [CATEGORIAS.OUTROS]: 'Outras Histórias'
    };
    return nomes[categoria] || categoria;
}

export default db;