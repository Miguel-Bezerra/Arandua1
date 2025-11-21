import { Router } from "express"
import db from "../config/bd.js"

const rotas = Router()

// ===== ROTAS DE USUÁRIO =====
rotas.post("/usuarios", (req, res) => {
    const { nome, senha, email, ft_perfil } = req.body

    if (!nome || !senha) {
        return res.status(400).json({ message: "Nome e senha são obrigatórios" })
    }

    const sql = `INSERT INTO Usuario (nome, senha, email, ft_perfil) 
                 VALUES (?, ?, ?, ?)`
    
    db.run(sql, [nome, senha, email, ft_perfil], function(err) {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao criar usuário", 
                error: err.message 
            })
        }
        res.status(201).json({ 
            message: "Usuário criado com sucesso", 
            id: this.lastID 
        })
    })
})

rotas.get("/usuarios/:id", (req, res) => {
    const { id } = req.params
    const sql = "SELECT id_usuario, nome, email, num_postagens, ft_perfil as foto_perfil FROM Usuario WHERE id_usuario = ?"
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao buscar usuário", 
                error: err.message 
            })
        }
        if (!row) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }
        res.json(row)
    })
})

rotas.get("/usuarios", (req, res) => {
    const sql = "SELECT id_usuario, nome, email, num_postagens, ft_perfil as foto_perfil FROM Usuario"
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao buscar usuários", 
                error: err.message 
            })
        }
        res.json(rows)
    })
})

rotas.put("/usuarios/:id", (req, res) => {
    const { id } = req.params
    const { nome, senha, email, ft_perfil } = req.body

    if (!nome) {
        return res.status(400).json({ message: "Nome é obrigatório" })
    }

    const sqlSelect = "SELECT senha, ft_perfil FROM Usuario WHERE id_usuario = ?"
    
    db.get(sqlSelect, [id], (err, currentUser) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao buscar usuário atual", 
                error: err.message 
            })
        }
        
        if (!currentUser) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }

        const finalSenha = senha || currentUser.senha
        const finalFtPerfil = ft_perfil !== undefined ? ft_perfil : currentUser.ft_perfil

        const sql = `UPDATE Usuario 
                     SET nome = ?, senha = ?, email = ?, ft_perfil = ? 
                     WHERE id_usuario = ?`
        
        db.run(sql, [nome, finalSenha, email, finalFtPerfil, id], function(err) {
            if (err) {
                return res.status(500).json({ 
                    message: "Erro ao atualizar usuário", 
                    error: err.message 
                })
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Usuário não encontrado" })
            }
            res.json({ message: "Usuário atualizado com sucesso" })
        })
    })
})

rotas.delete("/usuarios/:id", (req, res) => {
    const { id } = req.params
    const sql = "DELETE FROM Usuario WHERE id_usuario = ?"
    
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao deletar usuário", 
                error: err.message 
            })
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Usuário não encontrado" })
        }
        res.json({ message: "Usuário deletado com sucesso" })
    })
})

// ===== ROTA DE LOGIN =====
rotas.post("/login", (req, res) => {
    if (!req.body) {
        return res.status(400).json({ 
            success: false, 
            message: "Body da requisição está vazio" 
        });
    }

    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ 
            success: false,
            message: "Usuário e senha são obrigatórios" 
        });
    }

    const sql = `SELECT id_usuario, nome, email, senha, num_postagens, ft_perfil as foto_perfil 
                 FROM Usuario 
                 WHERE (nome = ? OR email = ?)`;
    
    db.get(sql, [usuario, usuario], (err, row) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Erro ao buscar usuário", 
                error: err.message 
            });
        }
        
        if (!row) {
            return res.status(401).json({ 
                success: false,
                message: "Usuário não encontrado" 
            });
        }

        if (row.senha !== senha) {
            return res.status(401).json({ 
                success: false,
                message: "Senha incorreta" 
            });
        }

        const userResponse = {
            id: row.id_usuario,
            nome: row.nome,
            email: row.email,
            num_postagens: row.num_postagens,
            foto_perfil: row.foto_perfil
        };
        
        res.json({
            success: true,
            user: userResponse
        });
    });
});

// ===== ROTAS DE HISTÓRIA (ANTIGAS POSTAGENS) =====

// Criar história
rotas.post("/historias", (req, res) => {
    console.log("📝 Recebendo nova história...");
    console.log("📦 Dados recebidos:", {
        id_usuario: req.body.id_usuario,
        titulo: req.body.titulo,
        categoria: req.body.categoria,
        hasImagem: !!req.body.imagem_capa,
        imagemLength: req.body.imagem_capa?.length
    });

    const { 
        id_usuario, 
        titulo, 
        conteudo, 
        categoria, 
        imagem_capa,
        tags
    } = req.body;

    // VALIDAÇÕES
    if (!id_usuario) {
        return res.status(400).json({ 
            success: false,
            message: "ID do usuário é obrigatório" 
        });
    }

    if (!titulo || titulo.trim().length < 2) {
        return res.status(400).json({ 
            success: false,
            message: "Título é obrigatório e deve ter pelo menos 2 caracteres" 
        });
    }

    if (!conteudo || conteudo.trim().length < 5) {
        return res.status(400).json({ 
            success: false,
            message: "Conteúdo é obrigatório e deve ter pelo menos 5 caracteres" 
        });
    }

    if (!categoria) {
        return res.status(400).json({ 
            success: false,
            message: "Categoria é obrigatória" 
        });
    }

    // Verificar dados da imagem
    const imagemFinal = imagem_capa;
    console.log("🖼️ Dados da imagem:", {
        temImagem: !!imagemFinal,
        tamanho: imagemFinal?.length,
        tipo: typeof imagemFinal
    });

    // converter base64 para Buffer para salvar como BLOB
    let imagemBuffer = null;
    if (imagemFinal && typeof imagemFinal === 'string') {
        try {
            imagemBuffer = Buffer.from(imagemFinal, 'base64');
        } catch (err) {
            console.warn('⚠️ Falha ao converter imagem base64 para Buffer:', err.message);
            imagemBuffer = null;
        }
    }

    // Verificar estrutura da tabela
    const sqlCheckColumns = "PRAGMA table_info(Historia)";
    
    db.all(sqlCheckColumns, [], (err, columns) => {
        if (err) {
            console.error("❌ Erro ao verificar colunas:", err);
            return res.status(500).json({ 
                success: false,
                message: "Erro interno do servidor", 
                error: err.message 
            });
        }

        const columnNames = columns.map(col => col.name);
        console.log("📋 Colunas disponíveis na tabela Historia:", columnNames);

        // Construir query dinamicamente
        let colunasInsert = ['id_usuario', 'conteudo', 'categoria', 'data_criacao'];
        let placeholders = ['?', '?', '?', 'datetime("now")'];
        let valores = [id_usuario, conteudo, categoria];

        // Adicionar título se a coluna existir
        if (columnNames.includes('titulo') && titulo) {
            colunasInsert.push('titulo');
            placeholders.push('?');
            valores.push(titulo);
        }

        // Adicionar imagem - usar apenas imagem_capa
        if (imagemBuffer && columnNames.includes('imagem_capa')) {
            colunasInsert.push('imagem_capa');
            placeholders.push('?');
            valores.push(imagemBuffer); // <-- inserir Buffer (BLOB)
            console.log("✅ Imagem (Buffer) será salva em 'imagem_capa'");
        } else if (imagemFinal && columnNames.includes('imagem_capa') && !imagemBuffer) {
            // se não conseguiu converter, tentar inserir como string (fallback)
            colunasInsert.push('imagem_capa');
            placeholders.push('?');
            valores.push(imagemFinal);
            console.log("⚠️ Inserindo imagem como string (fallback)");
        } else if (imagemFinal) {
            console.log("⚠️ Coluna 'imagem_capa' não encontrada, imagem não será salva");
        }

        // Adicionar tags se existir
        if (tags && columnNames.includes('tags')) {
            colunasInsert.push('tags');
            placeholders.push('?');
            valores.push(tags);
        }

        const sqlInsert = `INSERT INTO Historia (${colunasInsert.join(', ')}) VALUES (${placeholders.join(', ')})`;
        
        console.log("🚀 SQL final:", sqlInsert);
        console.log("📦 Valores:", {
            id_usuario: valores[0],
            conteudo: valores[1]?.substring(0, 50) + '...',
            categoria: valores[2],
            hasImagem: !!imagemFinal,
            colunasUtilizadas: colunasInsert
        });

        db.run(sqlInsert, valores, function(err) {
            if (err) {
                console.error("❌ Erro ao criar história:", err.message);
                return res.status(500).json({ 
                    success: false,
                    message: "Erro ao salvar história no banco", 
                    error: err.message 
                });
            }

            const historiaId = this.lastID;
            console.log("✅ História criada com sucesso! ID:", historiaId);
            
            res.status(201).json({ 
                success: true,
                message: "História criada com sucesso!",
                id: historiaId,
                hasImage: !!imagemFinal
            });
        });
    });
});

// Listar todas as histórias
rotas.get("/historias", (req, res) => {
    console.log("📖 Buscando todas as histórias...");
    
    const sql = `
        SELECT 
            p.*,
            u.nome as autor, 
            u.ft_perfil as foto_perfil_autor 
        FROM Historia p 
        LEFT JOIN Usuario u ON p.id_usuario = u.id_usuario 
        ORDER BY p.data_criacao DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("❌ Erro SQL ao buscar histórias:", err);
            return res.status(500).json({ 
                message: "Erro no banco de dados", 
                error: err.message 
            });
        }
        
        console.log(`✅ ${rows.length} histórias encontradas`);
        
        // DEBUG: Verificar dados das imagens
        rows.forEach((post, index) => {
            console.log(`📊 História ${index + 1}:`, {
                id: post.id_historia,
                hasImagem: !!(post.imagem_capa || post.imagem_criacao),
                imagemCapaLength: post.imagem_capa?.length,
                imagemHistoriaLength: post.imagem_capa?.length
            });
        });
        
        // Mapear os nomes das colunas para compatibilidade e converter BLOB -> base64
        const historias = rows.map(post => {
            const imagemCapaRaw = post.imagem_capa;
            const imagemCapaBase64 = imagemCapaRaw
                ? (Buffer.isBuffer(imagemCapaRaw) ? imagemCapaRaw.toString('base64') : imagemCapaRaw)
                : null;

            return {
                id: post.id_historia,
                id_historia: post.id_historia,
                id_usuario: post.id_usuario,
                titulo: post.titulo || (post.conteudo ? post.conteudo.substring(0, 50) + '...' : 'História sem título'),
                conteudo: post.conteudo || '',
                categoria: post.categoria || 'outros',
                tags: post.tags || '',
                data_criacao: post.data_criacao,
                num_curtidas: post.num_curtidas || 0,
                imagem_capa: imagemCapaBase64,
                autor: post.autor || 'Usuário',
                foto_perfil_autor: post.foto_perfil_autor
            };
        });
        
        res.json(historias);
    });
});

// Buscar história por ID
rotas.get("/historias/:id", (req, res) => {
    const { id } = req.params;
    const sql = `SELECT 
        p.id_historia,
        p.id_usuario,
        p.titulo,
        p.conteudo,
        p.categoria,
        p.imagem_capa,
        p.tags,
        p.tempo_leitura,
        p.data_criacao,
        p.num_curtidas,
        u.nome as autor, 
        u.ft_perfil as foto_perfil_autor 
     FROM Historia p 
     JOIN Usuario u ON p.id_usuario = u.id_usuario 
     WHERE p.id_historia = ?`;
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao buscar história", 
                error: err.message 
            });
        }
        if (!row) {
            return res.status(404).json({ message: "História não encontrada" });
        }
        
        const imagemCapaRaw = row.imagem_capa;
        const imagemCapaBase64 = imagemCapaRaw
            ? (Buffer.isBuffer(imagemCapaRaw) ? imagemCapaRaw.toString('base64') : imagemCapaRaw)
            : null;

        // Formatar resposta
        const historia = {
            id: row.id_historia,
            titulo: row.titulo,
            conteudo: row.conteudo,
            categoria: row.categoria,
            imagem_capa: imagemCapaBase64,
            tags: row.tags ? row.tags.split(',') : [],
            tempo_leitura: row.tempo_leitura,
            data_criacao: row.data_criacao,
            num_curtidas: row.num_curtidas || 0,
            autor: {
                id: row.id_usuario,
                nome: row.autor,
                foto_perfil: row.foto_perfil_autor
            }
        };
        
        res.json(historia);
    });
});

// Atualizar história
rotas.put("/historias/:id", (req, res) => {
    const { id } = req.params;
    const { 
        titulo, 
        conteudo, 
        categoria, 
        imagem_capa, 
        tags,
        tempo_leitura 
    } = req.body;

    if (!titulo || !conteudo || !categoria) {
        return res.status(400).json({ 
            message: "Título, conteúdo e categoria são obrigatórios" 
        });
    }

    const sql = `UPDATE Historia 
                 SET titulo = ?, conteudo = ?, categoria = ?, 
                     imagem_capa = ?, tags = ?, tempo_leitura = ?
                 WHERE id_historia = ?`;
    
    db.run(sql, [
        titulo, 
        conteudo, 
        categoria, 
        imagem_capa, 
        tags,
        tempo_leitura || null,
        id
    ], function(err) {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao atualizar história", 
                error: err.message 
            });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "História não encontrada" });
        }
        res.json({ message: "História atualizada com sucesso" });
    });
});

// Deletar história
rotas.delete("/historias/:id", (req, res) => {
    const { id } = req.params;
    
    console.log('Tentando deletar história ID:', id);

    const sqlSelect = "SELECT id_historia, id_usuario FROM Historia WHERE id_historia = ?";
    const sqlDelete = "DELETE FROM Historia WHERE id_historia = ?";
    const sqlUpdateUser = `UPDATE Usuario 
                          SET num_postagens = num_postagens - 1 
                          WHERE id_usuario = ? AND num_postagens > 0`;

    db.serialize(() => {
        db.get(sqlSelect, [id], (err, historia) => {
            if (err) {
                console.error("Erro ao buscar história:", err.message);
                return res.status(500).json({ 
                    message: "Erro interno ao buscar história", 
                    error: err.message 
                });
            }
            
            if (!historia) {
                console.log("História não encontrada, ID:", id);
                return res.status(404).json({ 
                    message: "História não encontrada" 
                });
            }

            const userId = historia.id_usuario;
            console.log("História encontrada, usuário:", userId);

            // Deletar comentários e curtidas relacionados
            const deleteComments = "DELETE FROM Comentario WHERE id_historia = ?";
            const deleteLikes = "DELETE FROM Curtida WHERE id_historia = ?";
            
            db.run(deleteComments, [id], function(err) {
                if (err) {
                    console.error("Erro ao deletar comentários:", err.message);
                } else {
                    console.log("Comentários deletados:", this.changes);
                }

                db.run(deleteLikes, [id], function(err) {
                    if (err) {
                        console.error("Erro ao deletar curtidas:", err.message);
                    } else {
                        console.log("Curtidas deletadas:", this.changes);
                    }

                    db.run(sqlDelete, [id], function(err) {
                        if (err) {
                            console.error("Erro ao deletar história:", err.message);
                            return res.status(500).json({ 
                                message: "Erro ao deletar história", 
                                error: err.message 
                            });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({ 
                                message: "História não encontrada" 
                            });
                        }

                        console.log("História deletada com sucesso");

                        db.run(sqlUpdateUser, [userId], function(updateErr) {
                            if (updateErr) {
                                console.error("Erro ao atualizar contador:", updateErr.message);
                            }
                            
                            res.json({ 
                                message: "História deletada com sucesso",
                                details: {
                                    historia_id: id,
                                    usuario_id: userId,
                                    contador_atualizado: !updateErr
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});

// Listar categorias disponíveis
rotas.get("/categorias", (req, res) => {
    const sql = `SELECT DISTINCT categoria 
                 FROM Historia 
                 WHERE categoria IS NOT NULL 
                 ORDER BY categoria`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao buscar categorias", 
                error: err.message 
            });
        }
        
        const categorias = rows.map(row => row.categoria);
        res.json(categorias);
    });
});

// Buscar histórias por categoria
rotas.get("/categorias/:categoria/historias", (req, res) => {
    const { categoria } = req.params;
    
    const sql = `SELECT 
        p.id_historia,
        p.id_usuario,
        p.titulo,
        p.conteudo,
        p.categoria,
        p.imagem_capa,
        p.tags,
        p.tempo_leitura,
        p.data_criacao,
        p.num_curtidas,
        u.nome as autor, 
        u.ft_perfil as foto_perfil_autor 
     FROM Historia p 
     JOIN Usuario u ON p.id_usuario = u.id_usuario 
     WHERE p.categoria = ?
     ORDER BY p.data_criacao DESC`;
    
    db.all(sql, [categoria], (err, rows) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao buscar histórias da categoria", 
                error: err.message 
            });
        }
        
        const historias = rows.map(historia => {
            const imagemRaw = historia.imagem_capa;
            const imagemBase64 = imagemRaw ? (Buffer.isBuffer(imagemRaw) ? imagemRaw.toString('base64') : imagemRaw) : null;

            return {
                id: historia.id_historia,
                titulo: historia.titulo,
                conteudo: historia.conteudo,
                categoria: historia.categoria,
                imagem_capa: imagemBase64,
                tags: historia.tags ? historia.tags.split(',') : [],
                tempo_leitura: historia.tempo_leitura,
                data_criacao: historia.data_criacao,
                num_curtidas: historia.num_curtidas || 0,
                autor: {
                    id: historia.id_usuario,
                    nome: historia.autor,
                    foto_perfil: historia.foto_perfil_autor
                }
            };
        });
        
        res.json(historias);
    });
});

// Rota para buscar histórias por categorias (múltiplas)
rotas.get('/historias/filtro', async (req, res) => {
    try {
        const { categorias } = req.query;
        
        if (!categorias) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro categorias é obrigatório'
            });
        }
        
        const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
        const placeholders = categoriasArray.map(() => '?').join(',');
        
        const query = `
            SELECT 
                h.id_historia,
                h.id_usuario,
                h.titulo,
                h.conteudo,
                h.categoria,
                h.imagem_capa,
                h.num_curtidas,
                h.num_comentarios,
                h.data_criacao,
                u.nome as autor,
                u.ft_perfil as foto_perfil_autor
            FROM Historia h
            LEFT JOIN Usuario u ON h.id_usuario = u.id_usuario
            WHERE h.categoria IN (${placeholders})
            ORDER BY h.data_criacao DESC
        `;
        
        const historiasRows = await new Promise((resolve, reject) => {
            db.all(query, categoriasArray, (err, rows) => {
                if (err) {
                    console.error('❌ Erro SQL ao filtrar histórias:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        
        // converter imagens BLOB -> base64 antes de enviar
        const historias = historiasRows.map(r => {
            const imagemRaw = r.imagem_capa;
            return {
                ...r,
                imagem_capa: imagemRaw ? (Buffer.isBuffer(imagemRaw) ? imagemRaw.toString('base64') : imagemRaw) : null
            };
        });
        
        res.json({
            success: true,
            data: historias,
            filtro: {
                categorias: categoriasArray,
                total: historias.length
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao filtrar histórias:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao filtrar histórias',
            error: error.message
        });
    }
});

// ===== ROTAS DE COMENTÁRIO =====

rotas.post("/comentarios", (req, res) => {
    const { id_historia, id_usuario, conteudo } = req.body

    if (!id_historia || !id_usuario || !conteudo) {
        return res.status(400).json({ 
            message: "ID da história, ID do usuário e conteúdo são obrigatórios" 
        })
    }

    const sql = `INSERT INTO Comentario (id_historia, id_usuario, conteudo) 
                 VALUES (?, ?, ?)`
    
    db.run(sql, [id_historia, id_usuario, conteudo], function(err) {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao criar comentário", 
                error: err.message 
            })
        }
        res.status(201).json({ 
            message: "Comentário criado com sucesso", 
            id: this.lastID 
        })
    })
})

rotas.get("/historias/:id/comentarios-com-respostas", (req, res) => {
    const historiaId = req.params.id;
    
    console.log("💬 DEBUG: Buscando comentários hierárquicos para história:", historiaId);

    // Buscar TODOS os comentários da história
    const sqlTodosComentarios = `
        SELECT 
            c.id_comentario,
            c.id_historia,
            c.id_usuario,
            c.id_comentario_pai,
            c.conteudo,
            c.data_comentario,
            c.num_curtidas,
            u.nome as autor,
            u.ft_perfil as foto_perfil_autor
        FROM Comentario c 
        LEFT JOIN Usuario u ON c.id_usuario = u.id_usuario 
        WHERE c.id_historia = ? 
        ORDER BY c.data_comentario ASC
    `;

    db.all(sqlTodosComentarios, [historiaId], (err, todosComentarios) => {
        if (err) {
            console.error("❌ Erro ao buscar comentários:", err);
            return res.status(500).json({ 
                error: "Erro ao buscar comentários",
                details: err.message 
            });
        }

        console.log(`💬 DEBUG: ${todosComentarios.length} comentários encontrados no total`);

        // Separar comentários principais de respostas
        const comentariosPrincipais = todosComentarios.filter(comment => 
            !comment.id_comentario_pai || comment.id_comentario_pai === null
        );
        
        const respostas = todosComentarios.filter(comment => 
            comment.id_comentario_pai && comment.id_comentario_pai !== null
        );

        console.log(`📊 Comentários principais: ${comentariosPrincipais.length}, Respostas: ${respostas.length}`);

        // Organizar respostas sob seus comentários pais
        const comentariosOrganizados = comentariosPrincipais.map(comentario => {
            const respostasDoComentario = respostas.filter(resposta => 
                resposta.id_comentario_pai === comentario.id_comentario
            );

            return {
                ...comentario,
                isMainComment: true,
                replies: respostasDoComentario.map(resposta => ({
                    ...resposta,
                    isReply: true,
                    parentAuthorName: comentario.autor // Guardar nome do autor pai
                }))
            };
        });

        res.json(comentariosOrganizados);
    });
});

// Deletar comentário
rotas.delete("/comentarios/:id", (req, res) => {
    const { id } = req.params
    const sql = "DELETE FROM Comentario WHERE id_comentario = ?"
    
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao deletar comentário", 
                error: err.message 
            })
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Comentário não encontrado" })
        }
        res.json({ message: "Comentário deletado com sucesso" })
    })
})

// ===== ROTAS DE RESPOSTAS A COMENTÁRIOS =====

// Criar resposta
rotas.post("/comentarios", (req, res) => {
    const { id_historia, id_usuario, conteudo, id_comentario_pai } = req.body;

    // Se tem id_comentario_pai, é uma resposta
    if (id_comentario_pai) {
        console.log("📝 Criando RESPOSTA para comentário:", id_comentario_pai);
    } else {
        console.log("📝 Criando COMENTÁRIO PRINCIPAL");
    }

    const sql = `INSERT INTO Comentario (id_historia, id_usuario, conteudo, id_comentario_pai) 
                 VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [id_historia, id_usuario, conteudo, id_comentario_pai || null], function(err) {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao criar comentário", 
                error: err.message 
            });
        }
        
        res.status(201).json({ 
            message: id_comentario_pai ? "Resposta criada com sucesso" : "Comentário criado com sucesso", 
            id: this.lastID,
            id_comentario_pai: id_comentario_pai || null
        });
    });
});

// Buscar comentários e respostas de uma história
rotas.get("/historias/:id/comentarios-com-respostas", (req, res) => {
    const historiaId = req.params.id;
    
    console.log("💬 DEBUG: Buscando comentários com respostas para história:", historiaId);

    // Buscar comentários principais (sem pai)
    const sqlComentariosPrincipais = `
        SELECT 
            c.id_comentario,
            c.id_historia,
            c.id_usuario,
            c.conteudo,
            c.data_comentario,
            c.num_curtidas,
            u.nome as autor,
            u.ft_perfil as foto_perfil_autor
        FROM Comentario c 
        LEFT JOIN Usuario u ON c.id_usuario = u.id_usuario 
        WHERE c.id_historia = ? AND c.id_comentario_pai IS NULL
        ORDER BY c.data_comentario ASC
    `;

    db.all(sqlComentariosPrincipais, [historiaId], (err, comentariosPrincipais) => {
        if (err) {
            console.error("❌ Erro ao buscar comentários principais:", err);
            return res.status(500).json({ 
                error: "Erro ao buscar comentários",
                details: err.message 
            });
        }

        console.log(`💬 DEBUG: ${comentariosPrincipais.length} comentários principais encontrados`);

        // Para cada comentário principal, buscar suas respostas
        const comentariosComRespostas = [];
        let comentariosProcessados = 0;

        if (comentariosPrincipais.length === 0) {
            return res.json([]);
        }

        comentariosPrincipais.forEach(comentario => {
            const sqlRespostas = `
                SELECT 
                    c.id_comentario,
                    c.id_usuario,
                    c.conteudo,
                    c.data_comentario,
                    c.num_curtidas,
                    u.nome as autor,
                    u.ft_perfil as foto_perfil_autor,
                    parent.id_usuario as parent_autor_id,
                    parent_u.nome as parent_autor_nome
                FROM Comentario c 
                LEFT JOIN Usuario u ON c.id_usuario = u.id_usuario 
                LEFT JOIN Comentario parent ON c.id_comentario_pai = parent.id_comentario
                LEFT JOIN Usuario parent_u ON parent.id_usuario = parent_u.id_usuario
                WHERE c.id_comentario_pai = ?
                ORDER BY c.data_comentario ASC
            `;

            db.all(sqlRespostas, [comentario.id_comentario], (err, respostas) => {
                if (err) {
                    console.error("❌ Erro ao buscar respostas:", err);
                    respostas = [];
                }

                comentariosComRespostas.push({
                    ...comentario,
                    respostas: respostas || []
                });

                comentariosProcessados++;

                // Quando todos os comentários forem processados, enviar resposta
                if (comentariosProcessados === comentariosPrincipais.length) {
                    // Ordenar por data do comentário principal
                    comentariosComRespostas.sort((a, b) => 
                        new Date(a.data_comentario) - new Date(b.data_comentario)
                    );
                    
                    res.json(comentariosComRespostas);
                }
            });
        });
    });
});

// ===== ROTAS DE FILTRO =====

// Rota para buscar todas as categorias
rotas.get('/categorias', async (req, res) => {
    try {
        const categorias = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM categorias ORDER BY nome', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        res.json({
            success: true,
            data: categorias
        });
    } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar categorias'
        });
    }
});

// Rota para buscar histórias por categorias (múltiplas)
rotas.get('/historias/filtro', async (req, res) => {
    try {
        const { categorias } = req.query;
        
        if (!categorias) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro categorias é obrigatório'
            });
        }
        
        const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
        const placeholders = categoriasArray.map(() => '?').join(',');
        
        const query = `
            SELECT 
                h.id_historia,
                h.id_usuario,
                h.titulo,
                h.conteudo,
                h.categoria,
                h.imagem_capa,
                h.num_curtidas,
                h.num_comentarios,
                h.data_criacao,
                u.nome as autor,
                u.ft_perfil as foto_perfil_autor
            FROM Historia h
            LEFT JOIN Usuario u ON h.id_usuario = u.id_usuario
            WHERE h.categoria IN (${placeholders})
            ORDER BY h.data_criacao DESC
        `;
        
        const historiasRows = await new Promise((resolve, reject) => {
            db.all(query, categoriasArray, (err, rows) => {
                if (err) {
                    console.error('❌ Erro SQL ao filtrar histórias:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
        
        // converter imagens BLOB -> base64 antes de enviar
        const historias = historiasRows.map(r => {
            const imagemRaw = r.imagem_capa;
            return {
                ...r,
                imagem_capa: imagemRaw ? (Buffer.isBuffer(imagemRaw) ? imagemRaw.toString('base64') : imagemRaw) : null
            };
        });
        
        res.json({
            success: true,
            data: historias,
            filtro: {
                categorias: categoriasArray,
                total: historias.length
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao filtrar histórias:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao filtrar histórias',
            error: error.message
        });
    }
});

// ===== ROTAS DE CURTIDA =====

// Criar curtida
rotas.post("/curtidas", (req, res) => {
    const { id_historia, id_usuario } = req.body

    if (!id_historia || !id_usuario) {
        return res.status(400).json({ 
            message: "ID da história e ID do usuário são obrigatórios" 
        })
    }

    // Mudar Curtida_Historia para Curtida
    const sqlCheck = "SELECT id_curtida FROM Curtida WHERE id_historia = ? AND id_usuario = ?"
    const sqlInsert = `INSERT INTO Curtida (id_historia, id_usuario) 
                       VALUES (?, ?)`
    const sqlUpdatePost = `UPDATE Historia 
                          SET num_curtidas = num_curtidas + 1 
                          WHERE id_historia = ?`

    db.serialize(() => {
        db.get(sqlCheck, [id_historia, id_usuario], (err, row) => {
            if (err) {
                return res.status(500).json({ 
                    message: "Erro ao verificar curtida", 
                    error: err.message 
                })
            }
            
            if (row) {
                return res.status(400).json({ 
                    message: "Usuário já curtiu esta história" 
                })
            }

            db.run(sqlInsert, [id_historia, id_usuario], function(err) {
                if (err) {
                    return res.status(500).json({ 
                        message: "Erro ao criar curtida", 
                        error: err.message 
                    })
                }

                db.run(sqlUpdatePost, [id_historia], function(err) {
                    if (err) {
                        console.error("Erro ao atualizar contador de curtidas:", err.message)
                        return res.status(500).json({ 
                            message: "Erro ao atualizar curtidas", 
                            error: err.message 
                        })
                    }
                    
                    res.status(201).json({ 
                        message: "História curtida com sucesso", 
                        id: this.lastID 
                    })
                })
            })
        })
    })
})

// Remover curtida
rotas.delete("/curtidas", (req, res) => {
    const { id_historia, id_usuario } = req.body

    if (!id_historia || !id_usuario) {
        return res.status(400).json({ 
            message: "ID da historia e ID do usuário são obrigatórios" 
        })
    }

    // Mudar Curtida_Historia para Curtida
    const sqlDelete = "DELETE FROM Curtida WHERE id_historia = ? AND id_usuario = ?"
    const sqlUpdatePost = `UPDATE Historia 
                          SET num_curtidas = num_curtidas - 1 
                          WHERE id_historia = ? AND num_curtidas > 0`

    db.serialize(() => {
        db.run(sqlDelete, [id_historia, id_usuario], function(err) {
            if (err) {
                return res.status(500).json({ 
                    message: "Erro ao remover curtida", 
                    error: err.message 
                })
            }
            if (this.changes === 0) {
                return res.status(404).json({ 
                    message: "Curtida não encontrada" 
                })
            }

            // Atualiza o contador de curtidas da história
            db.run(sqlUpdatePost, [id_historia], function(err) {
                if (err) {
                    console.error("Erro ao atualizar contador de curtidas:", err.message)
                }
                
                res.json({ message: "Curtida removida com sucesso" })
            })
        })
    })
})

// Verificar se usuário curtiu uma história
rotas.get("/curtidas/:historiaId/:usuarioId", (req, res) => {
    const { historiaId, usuarioId } = req.params;
    // Mudar Curtida_Historia para Curtida
    const sql = "SELECT id_curtida FROM Curtida WHERE id_historia = ? AND id_usuario = ?";
    
    db.get(sql, [historiaId, usuarioId], (err, row) => {
        if (err) {
            console.error("❌ Erro ao verificar curtida:", err);
            return res.status(500).json({ 
                message: "Erro ao verificar curtida", 
                error: err.message 
            });
        }
        res.json({ curtiu: !!row });
    });
});

// Contar curtidas de uma história
rotas.get("/historias/:id/curtidas", (req, res) => {
    const { id } = req.params
    const sql = "SELECT num_curtidas FROM Historia WHERE id_historia = ?"
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao contar curtidas", 
                error: err.message 
            })
        }
        res.json({ curtidas: row ? row.num_curtidas : 0 })
    })
})

// ===== ROTAS DE CURTIDA EM COMENTÁRIOS =====

// Curtir comentário
rotas.post("/curtidas-comentarios", (req, res) => {
    const { id_comentario, id_usuario } = req.body

    if (!id_comentario || !id_usuario) {
        return res.status(400).json({ 
            message: "ID do comentário e ID do usuário são obrigatórios" 
        })
    }

    // Verificar se o comentário existe
    const sqlCheckComment = "SELECT id_comentario FROM Comentario WHERE id_comentario = ?"
    const sqlCheckUser = "SELECT id_usuario FROM Usuario WHERE id_usuario = ?"
    const sqlCheckLike = "SELECT id_curtida_comentario FROM Curtida_Comentario WHERE id_comentario = ? AND id_usuario = ?"

    db.serialize(() => {
        // Verifica se comentário existe
        db.get(sqlCheckComment, [id_comentario], (err, comment) => {
            if (err) {
                return res.status(500).json({ 
                    message: "Erro ao verificar comentário", 
                    error: err.message 
                })
            }
            if (!comment) {
                return res.status(404).json({ message: "Comentário não encontrado" })
            }

            // Verifica se usuário existe
            db.get(sqlCheckUser, [id_usuario], (err, user) => {
                if (err) {
                    return res.status(500).json({ 
                        message: "Erro ao verificar usuário", 
                        error: err.message 
                    })
                }
                if (!user) {
                    return res.status(404).json({ message: "Usuário não encontrado" })
                }

                // Verifica se já curtiu
                db.get(sqlCheckLike, [id_comentario, id_usuario], (err, like) => {
                    if (err) {
                        return res.status(500).json({ 
                            message: "Erro ao verificar curtida", 
                            error: err.message 
                        })
                    }
                    if (like) {
                        return res.status(400).json({ 
                            message: "Usuário já curtiu este comentário" 
                        })
                    }

                    // Insere a curtida
                    const sqlInsert = `INSERT INTO Curtida_Comentario (id_comentario, id_usuario) VALUES (?, ?)`
                    db.run(sqlInsert, [id_comentario, id_usuario], function(err) {
                        if (err) {
                            return res.status(500).json({ 
                                message: "Erro ao criar curtida", 
                                error: err.message 
                            })
                        }
                        
                        res.status(201).json({ 
                            message: "Comentário curtido com sucesso", 
                            id: this.lastID 
                        })
                    })
                })
            })
        })
    })
})

// Remover curtida de comentário
rotas.delete("/curtidas-comentarios", (req, res) => {
    const { id_comentario, id_usuario } = req.body

    if (!id_comentario || !id_usuario) {
        return res.status(400).json({ 
            message: "ID do comentário e ID do usuário são obrigatórios" 
        })
    }

    const sqlDelete = "DELETE FROM Curtida_Comentario WHERE id_comentario = ? AND id_usuario = ?"
    const sqlUpdateComment = `UPDATE Comentario 
                             SET num_curtidas = COALESCE(num_curtidas, 0) - 1 
                             WHERE id_comentario = ? AND COALESCE(num_curtidas, 0) > 0`

    db.serialize(() => {
        db.run(sqlDelete, [id_comentario, id_usuario], function(err) {
            if (err) {
                return res.status(500).json({ 
                    message: "Erro ao remover curtida", 
                    error: err.message 
                })
            }
            if (this.changes === 0) {
                return res.status(404).json({ 
                    message: "Curtida não encontrada" 
                })
            }

            // Atualiza o contador de curtidas do comentário
            db.run(sqlUpdateComment, [id_comentario], function(err) {
                if (err) {
                    console.error("Erro ao atualizar contador de curtidas do comentário:", err.message)
                }
                
                res.json({ message: "Curtida removida com sucesso" })
            })
        })
    })
})

// Verificar se usuário curtiu um comentário
rotas.get("/curtidas-comentarios/:comentarioId/:usuarioId", (req, res) => {
    const { comentarioId, usuarioId } = req.params
    const sql = "SELECT id_curtida_comentario FROM Curtida_Comentario WHERE id_comentario = ? AND id_usuario = ?"
    
    db.get(sql, [comentarioId, usuarioId], (err, row) => {
        if (err) {
            return res.status(500).json({ 
                message: "Erro ao verificar curtida", 
                error: err.message 
            })
        }
        res.json({ curtiu: !!row })
    })
})

export default rotas