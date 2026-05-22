import { neon } from '@neondatabase/serverless';

// Conexão com o banco Neon usando a variável da Vercel
const sql = neon(process.env.POSTGRES_URL);

export default async function handler(req, res) {
    // Evita problemas de cache no navegador
    res.setHeader('Cache-Control', 'no-store, max-age=0');

    try {
        // 1. Cria a tabela correta para o seu mural se ela não existir
        await sql`CREATE TABLE IF NOT EXISTS mural_anuncios (slot_id TEXT PRIMARY KEY, value TEXT)`;

        // 2. Quando o site carrega (Método GET)
        if (req.method === 'GET') {
            const rows = await sql`SELECT slot_id, value FROM mural_anuncios`;
            
            // Monta o objeto { "segunda-8": "texto" } que o seu index.html espera receber
            const announcementsObj = {};
            rows.forEach(row => {
                announcementsObj[row.slot_id] = row.value;
            });
            
            return res.status(200).json(announcementsObj);
        }

        // 3. Quando o site envia dados (Método POST - Login ou Salvar)
        if (req.method === 'POST') {
            const { action, password, slotId, value } = req.body;

            // Defina aqui as suas senhas de acesso do sistema
            const ADMIN_PASSWORD = "123"; 
            const VISITOR_PASSWORD = "456"; 

            // Fluxo de LOGIN
            if (action === 'login') {
                if (password === ADMIN_PASSWORD) {
                    return res.status(200).json({ authenticated: true, role: 'admin' });
                } else if (password === VISITOR_PASSWORD) {
                    return res.status(200).json({ authenticated: true, role: 'visitor' });
                } else {
                    return res.status(401).json({ authenticated: false, message: "Código incorreto!" });
                }
            }

            // Fluxo de SALVAMENTO (Apenas Admin)
            if (action === 'save') {
                if (password !== ADMIN_PASSWORD) {
                    return res.status(403).json({ error: "Não autorizado" });
                }

                // Insere ou atualiza o anúncio no horário correspondente
                await sql`
                    INSERT INTO mural_anuncios (slot_id, value) 
                    VALUES (${slotId}, ${value})
                    ON CONFLICT (slot_id) 
                    DO UPDATE SET value = ${value}
                `;
                
                return res.status(200).json({ success: true });
            }
        }

        return res.status(405).json({ error: "Método não permitido" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno no servidor de banco de dados." });
    }
}