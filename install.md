# Implantação no Vercel - Alerta Recife

A aplicação já está configurada e pronta para ser implantada no Vercel.
Toda a configuração de rotas e o redirecionamento para funções serverless (API) e frontend (Vite/React) estão configurados no arquivo `vercel.json`.

Siga os passos abaixo para colocar a sua aplicação no ar:

## Passo a Passo de Implantação

### 1. Criar um repositório no GitHub (ou similar)

Se você ainda não enviou o código para o GitHub, GitLab ou Bitbucket, crie um repositório e envie seus arquivos.

```bash
git init
git add .
git commit -m "Preparando para o Vercel"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/alerta-recife.git
git push -u origin main
```

### 2. Conectar ao Vercel

1. Acesse [Vercel](https://vercel.com) e faça login (geralmente com sua conta do GitHub).
2. Clique no botão **"Add New..."** e selecione **"Project"**.
3. Importe o repositório `alerta-recife` que você acabou de criar.

### 3. Configuração do Projeto no Vercel

Na tela de configuração do projeto que vai abrir:

- **Framework Preset**: Deixe como `Vite`. O Vercel geralmente detecta isso automaticamente pelo `package.json` e `vite.config.ts`.
- **Root Directory**: `./` (Padrão).
- **Build and Output Settings**:
  - O Vercel usará as configurações padrão (`npm run build` e diretório de saída `dist`), que já estão definidas no nosso `vercel.json` também.

### 4. Configurar as Variáveis de Ambiente (MUITO IMPORTANTE!)

Antes de clicar em Deploy, expanda a seção **"Environment Variables"**.
Você precisa adicionar a chave de API do Gemini, caso contrário, a IA não funcionará.

- **Key**: `GEMINI_API_KEY`
- **Value**: `(Cole sua chave de API do Google Gemini aqui)`

*Nota: Esta variável será usada com segurança pela nossa "Serverless Function" em `api/gemini.js` para não expor sua chave no lado do cliente.*

### 5. Deploy

Clique no botão **"Deploy"**.

Aguarde alguns instantes enquanto o Vercel baixa as dependências, faz o build (`npm run build`) e publica a nossa Serverless Function.

## Checklist de Prontidão

- [x] O frontend faz chamadas para a rota `/api/gemini`, e não diretamente para a API do Google, o que protege a chave.
- [x] O Vercel está configurado (`vercel.json`) para aceitar tanto rotas de SPA (app em React) quanto rotas da pasta `api/`.
- [x] O comando de build (`npm run build`) para Vite e `dist` já estão definidos e compatíveis com Vercel.

**Pronto!** Sua aplicação estará operando com Edge/Serverless functions para comunicação segura com a API do Gemini.
