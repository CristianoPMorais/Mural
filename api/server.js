import { neon } from '@neondatabase/serverless';

// Conecta automaticamente usando a variável que a Vercel acabou de criar
const sql = neon(process.env.POSTGRES_URL);

// Exemplo de como salvar o anúncio no banco
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { nome, mensagem } = req.body;
        
        // Cria a tabela se não existir e insere o anúncio
        await sql`CREATE TABLE IF NOT EXISTS anuncios (id SERIAL PRIMARY KEY, nome TEXT, mensagem TEXT)`;
        await sql`INSERT INTO anuncios (nome, mensagem) VALUES (${nome}, ${mensagem})`;
        
        return res.status(200).json({ success: true });
    }
}