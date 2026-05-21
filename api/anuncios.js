import { kv } from '@vercel/kv';

const SENHA_VISITANTE = "gyn01"; // Conforme o seu HTML
const SENHA_ADMIN = "admingyn";

export default async function handler(req, res) {
    // Configura os cabeçalhos para evitar erros de CORS se testado localmente
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Método GET: Retorna todos os anúncios para montar a tabela
    if (req.method === 'GET') {
        try {
            const data = await kv.get('quadro_anuncios') || {};
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao buscar dados do banco." });
        }
    }

    // Método POST: Autenticação ou Salvamento de anúncios
    if (req.method === 'POST') {
        const { action, password, slotId, value } = req.body;

        // Ação de Login
        if (action === 'login') {
            if (password === SENHA_ADMIN) {
                return res.status(200).json({ authenticated: true, role: 'admin' });
            } else if (password === SENHA_VISITANTE) {
                return res.status(200).json({ authenticated: true, role: 'visitor' });
            }
            return res.status(401).json({ authenticated: false, message: "Código incorreto!" });
        }

        // Ação de Salvar Anúncio
        if (action === 'save') {
            if (password !== SENHA_ADMIN) {
                return res.status(403).json({ error: "Acesso negado." });
            }

            try {
                // Busca o estado atual do banco
                let currentData = await kv.get('quadro_anuncios') || {};
                // Atualiza o slot específico
                currentData[slotId] = value;
                // Grava de volta no banco Vercel KV
                await kv.set('quadro_anuncios', currentData);

                return res.status(200).json({ success: true });
            } catch (error) {
                return res.status(500).json({ error: "Erro ao salvar no banco." });
            }
        }
    }

    return res.status(405).json({ error: "Método não permitido." });
}